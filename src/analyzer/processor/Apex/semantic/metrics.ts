import type { ApexNodeJson } from '../../../types';
import { walkJson } from '../../commons/node';
import type { ApexSemanticAnalysis } from './analyze';
import type { ApexExecutableBody } from './declaration';
import { type ApexUnitFacts, apexUnitFactsOf } from './facts';
import { apexMemberNamesOf } from './members';

// 実行本体ごとのメトリクス (docs/plan.md 10 章 P4 の段 1)。処理フローの箱からではなく、構文 (文・式の木) から数える。
// SOQL・SOSL・DML・呼び出しは facts.ts の事実を本体ごとにまとめる。
// - 循環的複雑度 = 1 + if・else if の分岐 + for・for-each・while・do + catch + switch の when (else を除く)
//   + 論理演算子の && と || + 三項演算子
// - 認知的複雑度 (SonarSource の定義に合わせる):
//   if・三項演算子・switch・ループ・catch は +1 と入れ子の深さ、else if・else は +1、
//   同じ論理演算子の続き (a && b && c) は 1 つで +1 (演算子が変わるたびに +1)、自分を呼ぶ呼び出し (再帰) は +1。
//   入れ子の深さは if の分岐・三項演算子・switch・ループ・catch の中で 1 つ増える
// - 最大のネスト: if・ループ・switch・try の文が重なった深さ (本体の直下は 0)

/** 本体 1 つのメトリクス */
export type ApexBodyMetrics = {
    /** 本体の ID (本体を持つ宣言の ID) */
    bodyId: string;
    kind: ApexExecutableBody['kind'];
    /** 本体を持つ宣言の名前の並び (AccountService.sync・AccountService.name の get など) */
    path: string[];
    /** dependencies.ts の参照の member と同じ名前 (匿名 Apex は なし) */
    member?: string;
    cyclomatic: number;
    cognitive: number;
    /** 文の数 (ブロック { } は数えない) */
    statements: number;
    maxNesting: number;
    /** SOQL (Database.query などの動的なクエリを含む) */
    soql: number;
    soqlInLoop: number;
    sosl: number;
    soslInLoop: number;
    /** DML (文と Database.insert など) */
    dml: number;
    dmlInLoop: number;
    /** メソッドの呼び出し (this(...)・super(...) を含む。new は数えない) */
    calls: number;
    /** 呼び出し先 (<持ち主>.<メソッド>。持ち主が分からなければメソッド名だけ。名前の順、同じものは 1 つ) */
    callees: string[];
};

const LOOP_KINDS = new Set(['for', 'forEach', 'while', 'doWhile']);
const NESTING_STATEMENTS = new Set([...LOOP_KINDS, 'if', 'switch', 'try']);
const STATEMENT_KINDS = new Set([
    'break',
    'continue',
    'delete',
    'doWhile',
    'expression',
    'field',
    'for',
    'forEach',
    'if',
    'insert',
    'localVariable',
    'merge',
    'return',
    'runAs',
    'switch',
    'throw',
    'try',
    'undelete',
    'update',
    'upsert',
    'while',
]);

/** 認知的複雑度の入れ子の深さと、文の入れ子の深さ */
type Depth = { cognitive: number; statements: number };

/** 解析の結果から、実行本体ごとのメトリクス */
export const apexMetricsOf = (
    analysis: ApexSemanticAnalysis,
    facts: ApexUnitFacts = apexUnitFactsOf(analysis),
): ApexBodyMetrics[] => {
    const names = apexMemberNamesOf(analysis.declarations);
    return analysis.bodies.map((semantics) => {
        const body = semantics.body;
        let cyclomatic = 1;
        let cognitive = 0;
        let statements = 0;
        let maxNesting = 0;

        for (const statement of body.statements) {
            walkJson<ApexNodeJson, Depth>(
                statement as ApexNodeJson,
                {
                    enterAny: (node, { state }) => {
                        if (STATEMENT_KINDS.has(node.kind)) statements++;
                        if (NESTING_STATEMENTS.has(node.kind)) {
                            maxNesting = Math.max(maxNesting, state.statements + 1);
                            return { state: { ...state, statements: state.statements + 1 } };
                        }
                        return undefined;
                    },
                    enter: {
                        if: (node, { state }) => {
                            node.conditionBlock.forEach((branch, index) => {
                                if (branch.condition !== 'else') cyclomatic++;
                                // 最初の if は入れ子の深さも足す。else if・else は +1 だけ
                                cognitive += index === 0 ? 1 + state.cognitive : 1;
                            });
                            return {
                                state: {
                                    cognitive: state.cognitive + 1,
                                    statements: state.statements + 1,
                                },
                            };
                        },
                        conditional: (_node, { state }) => {
                            cyclomatic++;
                            cognitive += 1 + state.cognitive;
                            return { state: { ...state, cognitive: state.cognitive + 1 } };
                        },
                        switch: (node, { state }) => {
                            cyclomatic += node.when.filter(
                                (when) => when.condition.condition !== 'else',
                            ).length;
                            cognitive += 1 + state.cognitive;
                            return {
                                state: {
                                    cognitive: state.cognitive + 1,
                                    statements: state.statements + 1,
                                },
                            };
                        },
                        tryClause: (node, { state }) => {
                            if (node.condition !== 'catch') return undefined;
                            cyclomatic++;
                            cognitive += 1 + state.cognitive;
                            return { state: { ...state, cognitive: state.cognitive + 1 } };
                        },
                        logical: (node, { parent }) => {
                            if (node.operator === '??') return undefined;
                            cyclomatic++;
                            // 同じ演算子の続きは 1 つ (親が同じ演算子なら数えない)
                            const outer = parent?.kind === 'logical' ? parent.operator : undefined;
                            if (outer !== node.operator) cognitive++;
                            return undefined;
                        },
                        ...Object.fromEntries(
                            [...LOOP_KINDS].map((kind) => [
                                kind,
                                (_node: ApexNodeJson, { state }: { state: Depth }) => {
                                    cyclomatic++;
                                    cognitive += 1 + state.cognitive;
                                    return {
                                        state: {
                                            cognitive: state.cognitive + 1,
                                            statements: state.statements + 1,
                                        },
                                    };
                                },
                            ]),
                        ),
                    },
                },
                { cognitive: 0, statements: 0 },
            );
        }

        // 再帰 (自分の宣言に決まった呼び出し)
        cognitive += semantics.calls.filter(
            (call) => call.candidateIds.length === 1 && call.candidateIds[0] === body.id,
        ).length;

        const inBody = <T extends { context: { bodyId: string; inLoop: boolean } }>(items: T[]) =>
            items.filter((item) => item.context.bodyId === body.id);
        const count = <T extends { context: { inLoop: boolean } }>(items: T[]) => ({
            all: items.length,
            inLoop: items.filter((item) => item.context.inLoop).length,
        });
        const queries = inBody(facts.queries);
        const soql = count(queries.filter((q) => q.language !== 'sosl'));
        const sosl = count(queries.filter((q) => q.language === 'sosl'));
        const dml = count(inBody(facts.dml));
        const calls = inBody(facts.calls);
        const member = names.memberOf(names.byId.get(body.id));
        return {
            bodyId: body.id,
            kind: body.kind,
            path: body.path,
            ...(member ? { member } : {}),
            cyclomatic,
            cognitive,
            statements,
            maxNesting,
            soql: soql.all,
            soqlInLoop: soql.inLoop,
            sosl: sosl.all,
            soslInLoop: sosl.inLoop,
            dml: dml.all,
            dmlInLoop: dml.inLoop,
            calls: calls.length,
            callees: [
                ...new Set(
                    calls.map((call) =>
                        call.owner ? `${call.owner}.${call.method}` : call.method,
                    ),
                ),
            ].sort(),
        };
    });
};
