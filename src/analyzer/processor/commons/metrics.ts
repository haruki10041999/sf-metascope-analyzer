import type { JsonType } from '../../types';
import { walkJson } from './node';

// 構文から数えるメトリクスの、言語によらない部分 (Apex・LWC で共通。docs/plan.md 10 章 P4 の段 1)。
// 言語ごとの違いは「どの kind が if・ループ・switch・catch・論理演算子・三項演算子・文・中の関数か」だけなので、表 (spec) で渡す。
// - 循環的複雑度 = 1 + if・else if の分岐 + ループ + catch + switch の case (default・else を除く)
//   + 論理演算子の && と || + 三項演算子
// - 認知的複雑度 (SonarSource の定義に合わせる):
//   if・三項演算子・switch・ループ・catch は +1 と入れ子の深さ、else if・else は +1、
//   同じ論理演算子の続き (a && b && c) は 1 つで +1 (演算子が変わるたびに +1)。
//   入れ子の深さは if の分岐・三項演算子・switch・ループ・catch・中の関数の中で 1 つ増える。
//   再帰の +1 は言語ごとの呼び出しの解析で足す
// - 最大のネスト: if・ループ・switch・try の文が重なった深さ (本体の直下は 0)

type AnyNode = JsonType<string> & Record<string, unknown>;

/** 言語ごとの kind の表 */
export type SyntaxMetricsSpec = {
    /** if の文 (conditionBlock: { condition: 'else' | 式 }[] を持つ) */
    ifKind: string;
    loopKinds: ReadonlySet<string>;
    /** switch の文と、その case (default・else の case なら true を返す) */
    switchKind: string;
    switchCases: (node: AnyNode) => { isDefault: boolean }[];
    /** try の文と、その節 (condition: 'try' | 'catch' | 'finally') */
    tryKind: string;
    tryClauseKind: string;
    /** 論理演算子 (operator: '&&' | '||' | '??') */
    logicalKind: string;
    /** 三項演算子 */
    conditionalKind: string;
    /** 数える文 (ブロック { } は入れない) */
    statementKinds: ReadonlySet<string>;
    /** 中の関数 (コールバックなど。認知的複雑度の入れ子の深さを 1 つ増やす) */
    functionKinds?: ReadonlySet<string>;
};

export type SyntaxMetrics = {
    cyclomatic: number;
    cognitive: number;
    statements: number;
    maxNesting: number;
};

/** 認知的複雑度の入れ子の深さと、文の入れ子の深さ */
type Depth = { cognitive: number; statements: number };

/** 本体の文 (と式) の並びの、構文から数えるメトリクス */
export const syntaxMetricsOf = (
    roots: readonly unknown[],
    spec: SyntaxMetricsSpec,
): SyntaxMetrics => {
    const metrics: SyntaxMetrics = { cyclomatic: 1, cognitive: 0, statements: 0, maxNesting: 0 };
    const nestingStatements = new Set([
        ...spec.loopKinds,
        spec.ifKind,
        spec.switchKind,
        spec.tryKind,
    ]);
    const deeper = (state: Depth, cognitive: boolean, statement: boolean): Depth => ({
        cognitive: state.cognitive + (cognitive ? 1 : 0),
        statements: state.statements + (statement ? 1 : 0),
    });

    for (const root of roots) {
        if (!root || typeof root !== 'object' || !('kind' in root)) continue;
        walkJson<AnyNode, Depth>(
            root as AnyNode,
            {
                enterAny: (node, { state, parent }) => {
                    const kind = node.kind;
                    if (spec.statementKinds.has(kind)) metrics.statements++;
                    const isStatementNesting = nestingStatements.has(kind);
                    if (isStatementNesting) {
                        metrics.maxNesting = Math.max(metrics.maxNesting, state.statements + 1);
                    }
                    if (kind === spec.ifKind) {
                        const branches = node.conditionBlock as { condition: unknown }[];
                        branches.forEach((branch, index) => {
                            if (branch.condition !== 'else') metrics.cyclomatic++;
                            // 最初の if は入れ子の深さも足す。else if・else は +1 だけ
                            metrics.cognitive += index === 0 ? 1 + state.cognitive : 1;
                        });
                        return { state: deeper(state, true, true) };
                    }
                    if (spec.loopKinds.has(kind)) {
                        metrics.cyclomatic++;
                        metrics.cognitive += 1 + state.cognitive;
                        return { state: deeper(state, true, true) };
                    }
                    if (kind === spec.switchKind) {
                        metrics.cyclomatic += spec
                            .switchCases(node)
                            .filter((c) => !c.isDefault).length;
                        metrics.cognitive += 1 + state.cognitive;
                        return { state: deeper(state, true, true) };
                    }
                    if (kind === spec.tryClauseKind && node.condition === 'catch') {
                        metrics.cyclomatic++;
                        metrics.cognitive += 1 + state.cognitive;
                        return { state: deeper(state, true, false) };
                    }
                    if (kind === spec.conditionalKind) {
                        metrics.cyclomatic++;
                        metrics.cognitive += 1 + state.cognitive;
                        return { state: deeper(state, true, false) };
                    }
                    if (kind === spec.logicalKind && node.operator !== '??') {
                        metrics.cyclomatic++;
                        // 同じ演算子の続きは 1 つ (親が同じ演算子なら数えない)
                        const outer =
                            parent?.kind === spec.logicalKind ? parent.operator : undefined;
                        if (outer !== node.operator) metrics.cognitive++;
                        return undefined;
                    }
                    if (spec.functionKinds?.has(kind)) {
                        return { state: deeper(state, true, false) };
                    }
                    return isStatementNesting ? { state: deeper(state, false, true) } : undefined;
                },
            },
            { cognitive: 0, statements: 0 },
        );
    }
    return metrics;
};
