import type {
    ApexNodeJson,
    BaseExpressionJson,
    ConvertKeys,
    SoqlFunctionBody,
    SoqlJson,
    SoslJson,
    SubQueryJson,
} from '../../../types';
import { walkJson } from '../../commons/node';
import { type ApexExpressionRef, expressionRefResolverOf } from './call';
import type { ApexBodyAnalysis } from './statement';

// SOQL・SOSL の対象・項目・バインド式と、解析の事実 (docs/plan.md 10 章 P2)。
// - 項目は、書いた名前の並び (path) と、それを読む対象のオブジェクト (object) で持つ。
//   先頭がオブジェクト名・別名なら外す (`a.Name` → Name)。関係のパス (`Owner.Name`) の先のオブジェクトは、
//   スキーマ (リポジトリのオブジェクトの定義) を引く参照の解決で決める
// - 関数の中の項目 (`MAX(Amount)`・`CALENDAR_YEAR(CreatedDate)`・`DISTANCE(Location__c, ...)`) も、関数名つきで項目にする
// - サブクエリは別のクエリとして、親の ID と役割 (子リレーション・準結合) を持つ

/** 項目・バインド式を書いた句 */
export type ApexQueryClause =
    | 'select'
    | 'typeOf'
    | 'where'
    | 'having'
    | 'groupBy'
    | 'orderBy'
    | 'with'
    | 'limit'
    | 'offset'
    | 'find'
    | 'returning';

/** FROM のオブジェクト (SOSL は RETURNING のオブジェクト) */
export type ApexQueryObject = {
    /** 書いた名前 (サブクエリの FROM は子リレーションの名前) */
    name: string;
    alias?: string;
    sourceKeys: ConvertKeys;
};

export type ApexQueryField = {
    /** 項目を読む対象のオブジェクト (TYPEOF の WHEN はその型、SOSL は RETURNING のオブジェクト) */
    object: string;
    /** オブジェクト名・別名を外した名前の並び (`Owner.Name` は ['Owner', 'Name']) */
    path: string[];
    via: ApexQueryClause;
    /** 関数の引数のときの関数名 */
    function?: string;
    sourceKeys: ConvertKeys;
};

export type ApexQueryBind = {
    expression: BaseExpressionJson;
    ref: ApexExpressionRef;
    via: ApexQueryClause;
    sourceKeys: ConvertKeys;
};

/** 解析の事実 */
export type ApexQueryFacts = {
    hasLimit: boolean;
    /** LIMIT がバインド式か */
    limitIsBind: boolean;
    hasOffset: boolean;
    /** 集計 (集計関数か GROUP BY を持つ) か */
    isAggregate: boolean;
    /** FOR UPDATE・FOR VIEW・FOR REFERENCE */
    forClauses: string[];
    /** WITH USER_MODE・SYSTEM_MODE・SECURITY_ENFORCED */
    accessMode: 'USER_MODE' | 'SYSTEM_MODE' | 'SECURITY_ENFORCED' | null;
    allRows: boolean;
    usingScope: string | null;
    /** SELECT の別名 */
    aliases: string[];
    /** 使った関数の名前 (書いた順・重複なし) */
    functions: string[];
};

export type ApexQuery = {
    /** クエリの ID (soql・sosl・subQuery のノードの sourceKey) */
    id: string;
    bodyId: string;
    kind: 'soql' | 'sosl';
    /**
     * - query: 式として書いたクエリ
     * - childRelationship: SELECT の中のサブクエリ (FROM は子リレーションの名前)
     * - semiJoin: WHERE の中のサブクエリ (`Id IN (SELECT ...)`)
     */
    role: 'query' | 'childRelationship' | 'semiJoin';
    /** サブクエリの親のクエリの ID */
    parentId?: string;
    objects: ApexQueryObject[];
    fields: ApexQueryField[];
    binds: ApexQueryBind[];
    facts: ApexQueryFacts;
    sourceKeys: ConvertKeys;
    inLoop: boolean;
};

const AGGREGATE_FUNCTIONS = new Set(['AVG', 'COUNT', 'COUNT_DISTINCT', 'MIN', 'MAX', 'SUM']);
const ACCESS_MODES = new Set(['USER_MODE', 'SYSTEM_MODE', 'SECURITY_ENFORCED']);
const LOOP_KINDS = new Set(['for', 'forEach', 'while', 'doWhile']);

/** ノード自身がバインド式を持ち、句も決めるもの */
const CLAUSE_NODES: Readonly<Record<string, ApexQueryClause>> = {
    limitClause: 'limit',
    offsetClause: 'offset',
    soslFind: 'find',
};

type State = { via: ApexQueryClause; func?: string; object?: string };

/** 実行本体の中の SOQL・SOSL を、サブクエリを含めて書いた順に集める */
export const apexQueriesOf = (analysis: ApexBodyAnalysis): ApexQuery[] => {
    const bodyId = analysis.body.id;
    const refOf = expressionRefResolverOf(analysis);
    const queries: ApexQuery[] = [];

    const collect = (
        root: SoqlJson | SoslJson | SubQueryJson,
        role: ApexQuery['role'],
        inLoop: boolean,
        parentId?: string,
    ): void => {
        const query: ApexQuery = {
            id: root.sourceKeys.sourceKey,
            bodyId,
            kind: root.kind === 'sosl' ? 'sosl' : 'soql',
            role,
            ...(parentId ? { parentId } : {}),
            objects: [],
            fields: [],
            binds: [],
            facts: {
                hasLimit: false,
                limitIsBind: false,
                hasOffset: false,
                isAggregate: false,
                forClauses: [],
                accessMode: null,
                allRows: false,
                usingScope: null,
                aliases: [],
                functions: [],
            },
            sourceKeys: root.sourceKeys,
            inLoop,
        };
        queries.push(query);
        const facts = query.facts;

        if (root.kind !== 'sosl') {
            query.objects = root.from.field.map((from) => ({
                name: from.field.join('.'),
                ...(from.alias ? { alias: from.alias } : {}),
                sourceKeys: from.sourceKeys,
            }));
            facts.hasLimit = root.limit !== undefined;
            facts.limitIsBind = root.limit?.type === 'bind';
            facts.forClauses = root.for?.value ?? [];
            if (root.kind === 'soql') {
                facts.hasOffset = root.offset !== undefined;
                facts.allRows = root.allRows !== undefined;
                facts.usingScope = root.usingScope?.value ?? null;
                facts.isAggregate = root.groupBy !== undefined;
                if (root.with && ACCESS_MODES.has(root.with.mode)) {
                    facts.accessMode = root.with.mode as ApexQueryFacts['accessMode'];
                }
            }
        } else {
            facts.hasLimit = root.limit !== undefined;
            facts.limitIsBind = root.limit?.type === 'bind';
            const mode = root.with?.find((w) => ACCESS_MODES.has(w.mode))?.mode;
            if (mode) facts.accessMode = mode as ApexQueryFacts['accessMode'];
        }

        const mainObject = query.objects[0]?.name ?? '';
        const prefixes = new Set(
            query.objects
                .flatMap((o) => [o.name, ...(o.alias ? [o.alias] : [])])
                .map((n) => n.toLowerCase()),
        );
        /** 先頭のオブジェクト名・別名を外す (外すと空になるときは外さない) */
        const pathOf = (path: readonly string[]): string[] =>
            path.length > 1 && prefixes.has(path[0]?.toLowerCase() ?? '')
                ? path.slice(1)
                : [...path];

        const addField = (path: readonly string[], state: State, sourceKeys: ConvertKeys) =>
            query.fields.push({
                object: state.object ?? mainObject,
                path: pathOf(path),
                via: state.via,
                ...(state.func ? { function: state.func } : {}),
                sourceKeys,
            });

        /** 関数の中身。名前を事実に足し、引数が項目なら項目にする。引数がノードなら、その中の項目に関数名を引き継ぐ */
        const enterFunction = (
            body: SoqlFunctionBody,
            state: State,
            sourceKeys: ConvertKeys,
        ): { state: State } => {
            if (!facts.functions.includes(body.func)) facts.functions.push(body.func);
            if (AGGREGATE_FUNCTIONS.has(body.func)) facts.isAggregate = true;
            const inner = { ...state, func: body.func };
            if (Array.isArray(body.arg)) addField(body.arg, inner, sourceKeys);
            return { state: inner };
        };

        walkJson<ApexNodeJson, State>(
            root as ApexNodeJson,
            {
                enterAny: (node, { state }) => {
                    // バインド式 (WHERE の値・LIMIT・OFFSET・FIND・DISTANCE の起点など)
                    const bind = node as { type?: unknown; value?: unknown; field?: unknown };
                    if (bind.type === 'bind') {
                        const expression = (
                            node.kind === 'soqlLocation' ? bind.field : bind.value
                        ) as BaseExpressionJson;
                        query.binds.push({
                            expression,
                            ref: refOf(expression),
                            via: CLAUSE_NODES[node.kind] ?? state.via,
                            sourceKeys: expression.sourceKeys,
                        });
                        return 'skip';
                    }
                },
                enter: {
                    subQuery: (node, { state }) => {
                        if (node === root) return;
                        collect(
                            node,
                            state.via === 'select' ? 'childRelationship' : 'semiJoin',
                            inLoop,
                            query.id,
                        );
                        return 'skip';
                    },
                    soqlFrom: () => 'skip',
                    soqlSelect: (_node, { state }) => ({ state: { ...state, via: 'select' } }),
                    soqlWhere: (_node, { state }) => ({ state: { ...state, via: 'where' } }),
                    groupBy: (_node, { state }) => ({ state: { ...state, via: 'groupBy' } }),
                    soqlOrderBy: (_node, { state }) => ({ state: { ...state, via: 'orderBy' } }),
                    orderField: (node, { state }) => {
                        const next: State = { ...state, via: 'orderBy' };
                        if (node.type === 'field') {
                            addField(node.field, next, node.sourceKeys);
                            return;
                        }
                        return enterFunction(node, next, node.sourceKeys);
                    },
                    soqlWith: (_node, { state }) => ({ state: { ...state, via: 'with' } }),
                    limitClause: (_node, { state }) => ({ state: { ...state, via: 'limit' } }),
                    offsetClause: (_node, { state }) => ({ state: { ...state, via: 'offset' } }),
                    soslFind: (_node, { state }) => ({ state: { ...state, via: 'find' } }),
                    soqlLogical: (node, { state, parent }) => {
                        if (parent?.kind === 'groupBy' && parent.having === node) {
                            return { state: { ...state, via: 'having' } };
                        }
                        if (parent?.kind === 'soslFieldSpec' && parent.where === node) {
                            return { state: { ...state, via: 'where' } };
                        }
                    },
                    soslFieldSpec: (node, { state }) => {
                        const object = node.object.join('.');
                        query.objects.push({ name: object, sourceKeys: node.sourceKeys });
                        return { state: { ...state, via: 'returning', object } };
                    },
                    soslField: (node, { state }) => {
                        if (Array.isArray(node.field)) {
                            addField(node.field, state, node.sourceKeys);
                        }
                        if (node.func) {
                            if (!facts.functions.includes(node.func))
                                facts.functions.push(node.func);
                            return { state: { ...state, func: node.func } };
                        }
                    },
                    selectEntry: (node, { state }) => {
                        if (node.alias) facts.aliases.push(node.alias);
                        switch (node.type) {
                            case 'field':
                                addField(node.field, state, node.sourceKeys);
                                return;
                            case 'soqlFunction':
                                return enterFunction(node, state, node.sourceKeys);
                            case 'typeOf': {
                                // TYPEOF の多態の関係と、WHEN の型ごとの項目
                                addField(node.field, { ...state, via: 'typeOf' }, node.sourceKeys);
                                // ELSE の項目は型が決まらないので、多態の関係をたどるパス (What.Name) として持つ
                                for (const block of node.block) {
                                    const object =
                                        block.object === 'else'
                                            ? undefined
                                            : block.object.join('.');
                                    for (const field of block.field) {
                                        query.fields.push({
                                            object: object ?? mainObject,
                                            path: object ? [...field] : [...node.field, ...field],
                                            via: 'typeOf',
                                            sourceKeys: block.sourceKeys,
                                        });
                                    }
                                }
                                return 'skip';
                            }
                        }
                    },
                    soqlField: (node, { state }) =>
                        void addField(node.field, state, node.sourceKeys),
                    soqlFunction: (node, { state }) => enterFunction(node, state, node.sourceKeys),
                    soqlDateField: (node, { state }) =>
                        void addField(node.name, state, node.sourceKeys),
                    soqlLocation: (node, { state }) => {
                        if (node.type === 'field') addField(node.field, state, node.sourceKeys);
                    },
                },
            },
            { via: root.kind === 'sosl' ? 'find' : 'select' },
        );
    };

    let loopDepth = 0;
    for (const statement of analysis.body.statements) {
        walkJson<ApexNodeJson>(statement as ApexNodeJson, {
            enterAny: (node) => {
                if (LOOP_KINDS.has(node.kind)) loopDepth++;
            },
            leaveAny: (node) => {
                if (LOOP_KINDS.has(node.kind)) loopDepth--;
            },
            enter: {
                soql: (node) => {
                    collect(node, 'query', loopDepth > 0);
                    return 'skip';
                },
                sosl: (node) => {
                    collect(node, 'query', loopDepth > 0);
                    return 'skip';
                },
            },
        });
    }

    return queries;
};
