import { getLabelUsages, getMetadataFindings, getReferenceUsages } from './crossRef';
import {
    getAutomationByObject,
    getFlowDiagrams,
    getFlowDiffs,
    getFlowList,
    getFlowReferences,
} from './flow';
import { getFlexiPageDetails, getLayoutDetails, getLwcPlacements } from './page';
import {
    getApexAccess,
    getEffectivePermissions,
    getFieldAccessMatrix,
    getObjectAccessMatrix,
} from './permission';
import { getPermissionDiffs } from './permission';
import {
    type DependencyTraverseArgs,
    getDependencyChanges,
    getDependencyDiagram,
    getDependencyRows,
    getDependentRows,
    getImpactRows,
    getMissingRows,
    getUnusedRows,
} from './dependency';
import { maskRepository } from './mask';
import { snapshotInputOf } from './snapshot';
import type { ReportInput } from './types';

// レポートの data provider。方針: docs/report-components-plan.md 3.2 章
// provider の名前 (レポート仕様の data.provider で指定するもの) → 関数。引数は ReportInput (Repository) と provider ごとの引数。
// 種類ごとの provider は、Repository から作った MetadataSnapshot (snapshotInputOf) を使う

export * from './types';
export * from './commons';
export * from './permission';
export * from './flow';
export * from './page';
export * from './crossRef';
export * from './mask';
export * from './dependency';
export * from './snapshot';

export const REPORT_PROVIDERS = {
    'permission.diffs': (input: ReportInput) => getPermissionDiffs(snapshotInputOf(input)),
    'permission.objectAccess': (
        input: ReportInput,
        args: { onlyChanged?: boolean; rows?: string[] } = {},
    ) => getObjectAccessMatrix(snapshotInputOf(input), args),
    'permission.fieldAccess': (
        input: ReportInput,
        args: { onlyChanged?: boolean; rows?: string[] } = {},
    ) => getFieldAccessMatrix(snapshotInputOf(input), args),
    'permission.apexAccess': (input: ReportInput) => getApexAccess(snapshotInputOf(input)),
    'permission.effective': (input: ReportInput) => getEffectivePermissions(snapshotInputOf(input)),
    'flow.list': (input: ReportInput) => getFlowList(snapshotInputOf(input)),
    'flow.diagram': (input: ReportInput, args: { flows?: string[] } = {}) =>
        getFlowDiagrams(snapshotInputOf(input), args.flows),
    'flow.diffs': (input: ReportInput) => getFlowDiffs(snapshotInputOf(input)),
    'flow.references': (input: ReportInput) => getFlowReferences(snapshotInputOf(input)),
    'automation.byObject': (input: ReportInput) => getAutomationByObject(snapshotInputOf(input)),
    'layout.detail': (input: ReportInput, args: { layouts?: string[] } = {}) =>
        getLayoutDetails(snapshotInputOf(input), args.layouts),
    'flexiPage.detail': (input: ReportInput, args: { flexiPages?: string[] } = {}) =>
        getFlexiPageDetails(snapshotInputOf(input), args.flexiPages),
    'lwc.placements': (input: ReportInput, args: { lwc?: string[] } = {}) =>
        getLwcPlacements(snapshotInputOf(input), args.lwc),
    'crossRef.labels': (input: ReportInput) => getLabelUsages(input),
    'crossRef.references': (input: ReportInput) => getReferenceUsages(input),
    'metadata.findings': (input: ReportInput) => getMetadataFindings(input),
    'dependency.dependents': (input: ReportInput, args: DependencyTraverseArgs = { target: '' }) =>
        getDependentRows(input, args),
    'dependency.dependencies': (
        input: ReportInput,
        args: DependencyTraverseArgs = { target: '' },
    ) => getDependencyRows(input, args),
    'dependency.impact': (input: ReportInput, args: { depth?: number } = {}) =>
        getImpactRows(input, args),
    'dependency.missing': (input: ReportInput) => getMissingRows(input),
    'dependency.unused': (input: ReportInput) => getUnusedRows(input),
    'dependency.changes': (input: ReportInput) => getDependencyChanges(input),
    'dependency.graph': (
        input: ReportInput,
        args: { targets?: string[]; depth?: number; format?: 'mermaid' | 'dot' } = {},
    ) => getDependencyDiagram(input, args),
} as const;

export type ReportProviderName = keyof typeof REPORT_PROVIDERS;

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
    const provider = REPORT_PROVIDERS[name] as (input: ReportInput, args?: unknown) => unknown;
    if (!provider) throw new Error(`Unknown report provider: ${String(name)}`);
    const target =
        options.mask === false
            ? input
            : {
                  ...(input.before ? { before: maskRepository(input.before) } : {}),
                  after: maskRepository(input.after),
              };
    return args === undefined ? provider(target) : provider(target, args);
};
