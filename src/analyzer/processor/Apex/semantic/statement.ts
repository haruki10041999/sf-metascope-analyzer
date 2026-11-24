import type { ApexNodeJson, AssignmentJson, BaseExpressionJson, ConvertKeys } from '../../../types';
import { walkJson } from '../../commons/node';
import type {
    ApexDeclaration,
    ApexDeclarations,
    ApexExecutableBody,
    ApexVariableDeclaration,
} from './declaration';

// 実行本体の中の名前の解決と、変数の読み書き (docs/plan.md 5.1・10 章 P2)。
// - 識別子は、ブロックのスコープ (内側から)、引数、所有する型のメンバー (内側の型から外側へ) の順に探す
// - 実行の順は、式を評価する順に近づける (代入の書き込みは右辺を読んだあと、変数の初期値は初期値の式のあと)
// - 値の追跡は、同じ変数の「それより前の定義」を候補として返す。分岐・ループを考えた到達定義は P4 の CFG で作る

/** 名前の解決先 */
export type ApexNameTarget =
    /** 本体の中の変数 (引数・ローカル変数・for-each・catch・when の変数) */
    | { kind: 'variable'; declarationId: string }
    /** 所有する型 (外側の型を含む) のフィールド・プロパティ */
    | { kind: 'member'; declarationId: string }
    /** setter の暗黙の引数 value */
    | { kind: 'implicit'; name: 'value' }
    /** 見つからない (型名・名前空間・継承したメンバー・標準の名前など。参照の解決で扱う) */
    | { kind: 'unresolved' };

/**
 * 変数の使い方。
 * - read: 値を読む / write: 値を書く (`a = 1`) / readWrite: 読んで書く (`a += 1`・`a++`)
 * - memberWrite: 変数が指すものの中身を書き換える (`acc.Name = 'x'`・`items[0] = x`)。変数そのものは読む
 */
export type ApexVariableAccessKind = 'read' | 'write' | 'readWrite' | 'memberWrite';

/** 識別子 1 つの使い方 */
export type ApexVariableAccess = {
    bodyId: string;
    /** 識別子のノードのキー */
    sourceKeys: ConvertKeys;
    name: string;
    access: ApexVariableAccessKind;
    target: ApexNameTarget;
    /** 本体の中の実行の順 (0 から。読みと定義で同じ数の並び) */
    order: number;
    /** ループ (for・for-each・while・do-while) の中か */
    inLoop: boolean;
};

/** 変数に値を与えるところ */
export type ApexDefinitionKind =
    | 'parameter'
    | 'initializer'
    | 'assignment'
    | 'compoundAssignment'
    | 'increment'
    | 'loopVariable'
    | 'catchVariable'
    | 'whenVariable';

export type ApexDefinition = {
    bodyId: string;
    /** 値を受け取る変数の宣言の ID */
    declarationId: string;
    kind: ApexDefinitionKind;
    /** 定義のノード (変数・代入・増減・for-each などの節) のキー */
    sourceKeys: ConvertKeys;
    /** 与える値の式 (初期値・代入の右辺・for-each の集合。ないものは undefined) */
    value?: BaseExpressionJson;
    order: number;
    inLoop: boolean;
};

export type ApexBodyAnalysis = {
    body: ApexExecutableBody;
    accesses: ApexVariableAccess[];
    definitions: ApexDefinition[];
};

const LOOP_KINDS = new Set(['for', 'forEach', 'while', 'doWhile']);

/** 宣言の種類ごとに、宣言を置くノードの kind */
const DECLARING_NODE: Readonly<Record<ApexVariableDeclaration['kind'], string>> = {
    parameter: 'parameter',
    localVariable: 'variant',
    forEachVariable: 'forEach',
    catchVariable: 'tryClause',
    whenVariable: 'whenType',
};

/** for-each・catch・when の変数は、節に入るときに値を受け取る */
const CLAUSE_DEFINITIONS: Readonly<
    Partial<Record<ApexVariableDeclaration['kind'], ApexDefinitionKind>>
> = {
    forEachVariable: 'loopVariable',
    catchVariable: 'catchVariable',
    whenVariable: 'whenVariable',
};

/** 代入の左辺が、識別子 x そのものか、x を根にした x.a・x[0] か */
const rootIdentifierOf = (expression: BaseExpressionJson): BaseExpressionJson | undefined => {
    let current = expression;
    for (;;) {
        if (current.kind === 'identifier') return current;
        if (current.kind === 'parenthesized') current = current.expression;
        else if (current.kind === 'memberAccess' || current.kind === 'index')
            current = current.object;
        else return undefined;
    }
};

type Frame = { sourceKey: string; variables: Map<string, ApexVariableDeclaration> };

/** 実行本体ごとに、識別子の解決先と読み書き、定義を集める */
export const analyzeApexBodies = ({
    declarations,
    bodies,
}: ApexDeclarations): ApexBodyAnalysis[] => {
    const byId = new Map(declarations.map((d) => [d.id, d]));
    const variablesById = new Map(
        declarations.flatMap((d): [string, ApexVariableDeclaration][] =>
            d.kind === 'parameter' ||
            d.kind === 'localVariable' ||
            d.kind === 'forEachVariable' ||
            d.kind === 'catchVariable' ||
            d.kind === 'whenVariable'
                ? [[d.id, d]]
                : [],
        ),
    );

    /** 型の宣言の ID → そのフィールド・プロパティ (小文字の名前 → 宣言) */
    const membersOf = new Map<string, Map<string, ApexDeclaration>>();
    for (const d of declarations) {
        if ((d.kind === 'field' || d.kind === 'property') && d.ownerId) {
            const members = membersOf.get(d.ownerId) ?? new Map<string, ApexDeclaration>();
            if (!members.has(d.nameKey)) members.set(d.nameKey, d);
            membersOf.set(d.ownerId, members);
        }
    }

    /** 本体を所有する型の並び (内側から) */
    const ownerTypesOf = (id: string): string[] => {
        const types: string[] = [];
        for (let current = byId.get(id); current; current = byId.get(current.ownerId ?? '')) {
            if (current.kind === 'class' || current.kind === 'interface' || current.kind === 'enum')
                types.push(current.id);
            if (!current.ownerId) break;
        }
        return types;
    };

    return bodies.map((body) => {
        const accesses: ApexVariableAccess[] = [];
        const definitions: ApexDefinition[] = [];
        const ownerTypes = ownerTypesOf(body.id);
        const isSetter = body.kind === 'setter';
        let order = 0;
        let loopDepth = 0;

        const root: Frame = { sourceKey: body.id, variables: new Map() };
        const frames: Frame[] = [root];
        const declare = (declaration: ApexVariableDeclaration) => {
            const frame =
                [...frames].reverse().find((f) => f.sourceKey === declaration.scopeKey) ?? root;
            frame.variables.set(declaration.nameKey, declaration);
        };
        const define = (
            declaration: ApexVariableDeclaration,
            kind: ApexDefinitionKind,
            sourceKeys: ConvertKeys,
            value?: BaseExpressionJson,
        ) =>
            definitions.push({
                bodyId: body.id,
                declarationId: declaration.id,
                kind,
                sourceKeys,
                ...(value ? { value } : {}),
                order: order++,
                inLoop: loopDepth > 0,
            });

        for (const id of body.parameterIds) {
            const parameter = variablesById.get(id);
            if (!parameter) continue;
            root.variables.set(parameter.nameKey, parameter);
            define(parameter, 'parameter', parameter.sourceKeys);
        }

        const resolve = (name: string): ApexNameTarget => {
            const key = name.toLowerCase();
            for (let i = frames.length - 1; i >= 0; i--) {
                const found = frames[i]?.variables.get(key);
                if (found) return { kind: 'variable', declarationId: found.id };
            }
            if (isSetter && key === 'value') return { kind: 'implicit', name: 'value' };
            for (const type of ownerTypes) {
                const member = membersOf.get(type)?.get(key);
                if (member) return { kind: 'member', declarationId: member.id };
            }
            return { kind: 'unresolved' };
        };

        /** 書き込み (代入・増減) は、右辺を読んだあとに順を付けるため、ノードを出るときに記録する */
        const pendingWrites = new Map<object, () => void>();

        const record = (
            node: ApexNodeJson & { kind: 'identifier' },
            access: ApexVariableAccessKind,
        ) =>
            accesses.push({
                bodyId: body.id,
                sourceKeys: node.sourceKeys,
                name: node.name,
                access,
                target: resolve(node.name),
                order: order++,
                inLoop: loopDepth > 0,
            });

        /** 代入の左辺・増減の対象の識別子の、使い方 */
        const accessOfTarget = (
            target: BaseExpressionJson,
            direct: ApexVariableAccessKind,
        ): { node: BaseExpressionJson; access: ApexVariableAccessKind } | undefined => {
            const rootIdentifier = rootIdentifierOf(target);
            if (!rootIdentifier) return undefined;
            return {
                node: rootIdentifier,
                access: rootIdentifier === target ? direct : 'memberWrite',
            };
        };

        /** 書き込みの対象として、enter で記録しない識別子 */
        const deferred = new Set<object>();

        const definitionOfWrite = (
            identifier: BaseExpressionJson,
            access: ApexVariableAccessKind,
            kind: ApexDefinitionKind,
            node: ApexNodeJson,
            value?: BaseExpressionJson,
        ) => {
            if (identifier.kind !== 'identifier') return;
            deferred.add(identifier);
            pendingWrites.set(node, () => {
                record(identifier, access);
                const target = accesses[accesses.length - 1]?.target;
                if (access === 'memberWrite' || target?.kind !== 'variable') return;
                const declaration = variablesById.get(target.declarationId);
                if (declaration) define(declaration, kind, node.sourceKeys, value);
            });
        };

        for (const statement of body.statements) {
            walkJson<ApexNodeJson>(statement as ApexNodeJson, {
                enterAny: (node) => {
                    frames.push({ sourceKey: node.sourceKeys.sourceKey, variables: new Map() });
                    if (LOOP_KINDS.has(node.kind)) loopDepth++;
                    // 宣言を置くノードに入ったら、宣言をスコープに登録する
                    const declaration = variablesById.get(node.sourceKeys.sourceKey);
                    if (declaration && DECLARING_NODE[declaration.kind] === node.kind) {
                        declare(declaration);
                        const kind = CLAUSE_DEFINITIONS[declaration.kind];
                        if (kind) {
                            define(
                                declaration,
                                kind,
                                node.sourceKeys,
                                node.kind === 'forEach' ? node.right : undefined,
                            );
                        }
                    }
                },
                leaveAny: (node) => {
                    pendingWrites.get(node)?.();
                    if (LOOP_KINDS.has(node.kind)) loopDepth--;
                    frames.pop();
                },
                enter: {
                    assignment: (node: AssignmentJson) => {
                        const target = accessOfTarget(
                            node.left,
                            node.operator === '=' ? 'write' : 'readWrite',
                        );
                        if (target) {
                            definitionOfWrite(
                                target.node,
                                target.access,
                                node.operator === '=' ? 'assignment' : 'compoundAssignment',
                                node,
                                node.right,
                            );
                        }
                    },
                    unary: (node) => {
                        if (node.operator !== '++' && node.operator !== '--') return;
                        const target = accessOfTarget(node.argument, 'readWrite');
                        if (target) {
                            definitionOfWrite(target.node, target.access, 'increment', node);
                        }
                    },
                    call: (node) => {
                        // f(...) の f はメソッドの名前 (変数ではない)
                        if (node.callee.kind === 'identifier') deferred.add(node.callee);
                    },
                    identifier: (node) => {
                        if (!deferred.has(node)) record(node, 'read');
                    },
                },
                leave: {
                    variant: (node) => {
                        const declaration = variablesById.get(node.sourceKeys.sourceKey);
                        if (declaration?.kind === 'localVariable' && node.init) {
                            define(declaration, 'initializer', node.sourceKeys, node.init);
                        }
                    },
                },
            });
        }

        return { body, accesses, definitions };
    });
};

/**
 * 変数の読みに届きうる定義の候補: 同じ変数の、読みより前の定義
 * (分岐を考えないので、if の両方の枝の代入が候補になる。ループの中の読みには、ループの中のあとの定義も足す)
 */
export const definitionCandidatesOf = (
    analysis: ApexBodyAnalysis,
    access: ApexVariableAccess,
): ApexDefinition[] => {
    if (access.target.kind !== 'variable') return [];
    const declarationId = access.target.declarationId;
    return analysis.definitions.filter(
        (d) =>
            d.declarationId === declarationId &&
            (d.order < access.order || (access.inLoop && d.inLoop)),
    );
};
