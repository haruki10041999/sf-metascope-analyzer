import type { LwcModuleJson } from '../../types';
import { type SyntaxMetrics, type SyntaxMetricsSpec, syntaxMetricsOf } from '../commons/metrics';
import { type LwcContentCalls, analyzeLwcModuleCalls } from './calls';

// LWC の JS / TS の本体ごとのメトリクス (docs/plan.md 10 章 P4 の段 1)。構文の数え方は Apex と共通
// (commons/metrics.ts の syntaxMetricsOf) で、LWC の kind の表を渡す。本体の区切りは呼び出しの解析 (calls.ts の
// analyzeLwcModuleCalls) と同じ (コンポーネント・クラスのメンバー、直下の関数・変数の初期値、直下の文)。
// 中の関数 (then のコールバックなど) は外側の本体の分として数え、認知的複雑度の入れ子を 1 つ深くする

/** LWC の kind の表 */
const LWC_SYNTAX: SyntaxMetricsSpec = {
    ifKind: 'jsIf',
    loopKinds: new Set(['jsFor', 'jsForIn', 'jsForOf', 'jsWhile', 'jsDoWhile']),
    switchKind: 'jsSwitch',
    switchCases: (node) =>
        (node.cases as { test?: unknown }[]).map((c) => ({ isDefault: c.test === undefined })),
    tryKind: 'jsTry',
    tryClauseKind: 'jsTryClause',
    logicalKind: 'jsLogical',
    conditionalKind: 'jsConditional',
    statementKinds: new Set([
        'jsBreak',
        'jsContinue',
        'jsDebugger',
        'jsDoWhile',
        'jsExpression',
        'jsFor',
        'jsForIn',
        'jsForOf',
        'jsFunctionDeclaration',
        'jsIf',
        'jsLocalVariable',
        'jsReturn',
        'jsSwitch',
        'jsThrow',
        'jsTry',
        'jsWhile',
        'jsWith',
    ]),
    functionKinds: new Set(['jsFunction', 'jsObjectMethod', 'jsFunctionDeclaration']),
};

/** 本体 1 つのメトリクス */
export type LwcBodyMetrics = SyntaxMetrics & {
    ownerKind: LwcContentCalls['ownerKind'];
    /** コンポーネント・クラス・宣言の名前 (名前のないコンポーネント・直下の文は null) */
    owner: string | null;
    /** メンバーの名前 (static ブロックは 'static'。宣言・直下の文は持たない) */
    member?: string;
    /** 呼び出しの数 (Apex・LDS・ナビゲーション・dispatchEvent など、calls.ts が拾う決まった形のもの) */
    calls: number;
    /** 呼び出し先 (Apex は <クラス>.<メソッド>、ほかは呼び出しの対象。名前の順、同じものは 1 つ) */
    callees: string[];
    /** @salesforce/apex から import したメソッドの呼び出し (imperative) */
    apexCalls: number;
    /** そのうち、ループの中のもの (サーバーへの往復が増える) */
    apexCallsInLoop: number;
    /** イベントの発行 (this.dispatchEvent) */
    events: number;
};

/** モジュールの本体ごとのメトリクス */
export const lwcMetricsOf = (module: LwcModuleJson): LwcBodyMetrics[] =>
    analyzeLwcModuleCalls(module).map((content) => {
        // 直下の文 (content を持たない) は、モジュールの直下の文の並び
        const roots: unknown[] = content.content
            ? [
                  ...(content.content.block ?? []),
                  (content.content as { expression?: unknown }).expression,
              ]
            : (module.statements ?? []);
        const apex = content.calls.filter((call) => call.callType === 'apex');
        return {
            ownerKind: content.ownerKind,
            owner: content.owner,
            ...(content.member !== undefined ? { member: content.member } : {}),
            ...syntaxMetricsOf(roots, LWC_SYNTAX),
            calls: content.calls.length,
            callees: [
                ...new Set(
                    content.calls.flatMap((call) =>
                        call.apex
                            ? [`${call.apex.className}.${call.apex.methodName}`]
                            : call.target
                              ? [call.target]
                              : [],
                    ),
                ),
            ].sort(),
            apexCalls: apex.length,
            apexCallsInLoop: apex.filter((call) => call.context.loopDepth > 0).length,
            events: content.calls.filter((call) => call.callType === 'dispatchEvent').length,
        };
    });
