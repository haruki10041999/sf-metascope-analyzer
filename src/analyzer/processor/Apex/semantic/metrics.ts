import type { ConvertKeys } from '../../../types';
import { type SyntaxMetricsSpec, syntaxMetricsOf } from '../../commons/metrics';
import type { ApexSemanticAnalysis } from './analyze';
import type { ApexExecutableBody } from './declaration';
import { type ApexUnitFacts, apexUnitFactsOf } from './facts';
import { apexMemberNamesOf } from './members';
import { apexTypeRefOf, apexTypeTextOf } from './type';

// 実行本体ごとのメトリクス (docs/plan.md 10 章 P4 の段 1)。処理フローの箱からではなく、構文 (文・式の木) から数える。
// 構文の数え方は言語によらない部品 (commons/metrics.ts の syntaxMetricsOf) に Apex の kind の表を渡す。
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
    /** メソッド・コンストラクターの名前と引数の型 (calc(Integer, String))。オーバーロードを分ける */
    signature?: string;
    /** dependencies.ts の参照の member と同じ名前 (匿名 Apex は なし) */
    member?: string;
    /** 本体を持つ宣言の位置 */
    sourceKeys?: ConvertKeys;
    /** テストの中か (@IsTest のクラス・メソッド、testMethod) */
    isTest: boolean;
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

/** Apex の kind の表 (数え方は commons/metrics.ts。言語によらない) */
const APEX_SYNTAX: SyntaxMetricsSpec = {
    ifKind: 'if',
    loopKinds: new Set(['for', 'forEach', 'while', 'doWhile']),
    switchKind: 'switch',
    switchCases: (node) =>
        (node.when as { condition: { condition: unknown } }[]).map((when) => ({
            isDefault: when.condition.condition === 'else',
        })),
    tryKind: 'try',
    tryClauseKind: 'tryClause',
    logicalKind: 'logical',
    conditionalKind: 'conditional',
    statementKinds: new Set([
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
    ]),
};

/** 解析の結果から、実行本体ごとのメトリクス */
export const apexMetricsOf = (
    analysis: ApexSemanticAnalysis,
    facts: ApexUnitFacts = apexUnitFactsOf(analysis),
): ApexBodyMetrics[] => {
    const names = apexMemberNamesOf(analysis.declarations, analysis.repository?.index);
    return analysis.bodies.map((semantics) => {
        const body = semantics.body;
        const syntax = syntaxMetricsOf(body.statements, APEX_SYNTAX);

        // 再帰 (自分の宣言に決まった呼び出し)
        const recursion = semantics.calls.filter(
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
        const declaration = names.byId.get(body.id);
        const signature =
            body.kind === 'method' || body.kind === 'constructor'
                ? `${body.path[body.path.length - 1]}(${body.parameterIds
                      .map((id) => names.byId.get(id))
                      .map((p) =>
                          p && 'type' in p && typeof p.type === 'object'
                              ? apexTypeTextOf(apexTypeRefOf(p.type))
                              : '?',
                      )
                      .join(', ')})`
                : undefined;
        const member = names.memberOf(declaration);
        return {
            bodyId: body.id,
            kind: body.kind,
            path: body.path,
            ...(signature ? { signature } : {}),
            ...(member ? { member } : {}),
            ...(declaration ? { sourceKeys: declaration.sourceKeys } : {}),
            isTest: names.isTestOf(declaration),
            cyclomatic: syntax.cyclomatic,
            cognitive: syntax.cognitive + recursion,
            statements: syntax.statements,
            maxNesting: syntax.maxNesting,
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
