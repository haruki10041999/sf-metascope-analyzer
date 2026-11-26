import { maskRepository } from './mask';
import { REPORT_PROVIDERS, type ReportProviderName, isReportProviderName } from './registry';
import type { ReportInput } from './types';

// レポートの data provider。方針: docs/report-components-plan.md 3.2 章
// provider の名前・説明・引数と出力のスキーマは登録表 (registry.ts) にある。
// 種類ごとの provider は、Repository から作った MetadataSnapshot (snapshotInputOf) を使う

export * from './types';
export * from './commons';
export * from './permission';
export * from './flow';
export * from './code';
export * from './page';
export * from './object';
export * from './apex';
export * from './lwc';
export * from './translation';
export * from './metadata';
export * from './members';
export * from './feature';
export * from './apexFlow';
export * from './apexCallFlow';
export * from './apexEntryPoints';
export * from './apexUnused';
export * from './crossProject';
export * from './lwcEventFlow';
export * from './lwcFlow';
export * from './codeFlow';
export * from './crossRef';
export * from './mask';
export * from './dependency';
export * from './snapshot';
export * from './schemas';
export * from './registry';

/** レポートのデータを外に出すとき (HTML・MCP・AI に渡すとき) の選び方 */
export type ReportRunOptions = {
    /** 機密になりうる値 (指定ログイン情報の URL など) を伏せるか (既定は true。report/mask.ts) */
    mask?: boolean;
};

/**
 * provider を名前で呼ぶ。外に出すデータの入口で、既定では機密になりうる値を伏せたリポジトリを使う
 */
export const runReportProvider = (
    name: ReportProviderName,
    input: ReportInput,
    args?: unknown,
    options: ReportRunOptions = {},
): unknown => {
    if (!isReportProviderName(name)) throw new Error(`Unknown report provider: ${String(name)}`);
    const provider = REPORT_PROVIDERS[name] as (input: ReportInput, args?: unknown) => unknown;
    const target =
        options.mask === false
            ? input
            : {
                  ...(input.before ? { before: maskRepository(input.before) } : {}),
                  after: maskRepository(input.after),
              };
    return provider(target, args);
};
