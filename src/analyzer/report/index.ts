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
import type { ReportInput } from './types';

// レポートの data provider。方針: docs/report-components-plan.md 3.2 章
// provider の名前 (レポート仕様の data.provider で指定するもの) → 関数。引数は ReportInput と provider ごとの引数

export * from './types';
export * from './commons';
export * from './permission';
export * from './flow';
export * from './page';
export * from './crossRef';

export const REPORT_PROVIDERS = {
    'permission.diffs': (input: ReportInput) => getPermissionDiffs(input),
    'permission.objectAccess': (
        input: ReportInput,
        args: { onlyChanged?: boolean; rows?: string[] } = {},
    ) => getObjectAccessMatrix(input, args),
    'permission.fieldAccess': (
        input: ReportInput,
        args: { onlyChanged?: boolean; rows?: string[] } = {},
    ) => getFieldAccessMatrix(input, args),
    'permission.apexAccess': (input: ReportInput) => getApexAccess(input),
    'permission.effective': (input: ReportInput) => getEffectivePermissions(input),
    'flow.list': (input: ReportInput) => getFlowList(input),
    'flow.diagram': (input: ReportInput, args: { flows?: string[] } = {}) =>
        getFlowDiagrams(input, args.flows),
    'flow.diffs': (input: ReportInput) => getFlowDiffs(input),
    'flow.references': (input: ReportInput) => getFlowReferences(input),
    'automation.byObject': (input: ReportInput) => getAutomationByObject(input),
    'layout.detail': (input: ReportInput, args: { layouts?: string[] } = {}) =>
        getLayoutDetails(input, args.layouts),
    'flexiPage.detail': (input: ReportInput, args: { flexiPages?: string[] } = {}) =>
        getFlexiPageDetails(input, args.flexiPages),
    'lwc.placements': (input: ReportInput, args: { lwc?: string[] } = {}) =>
        getLwcPlacements(input, args.lwc),
    'crossRef.labels': (input: ReportInput) => getLabelUsages(input),
    'crossRef.references': (input: ReportInput) => getReferenceUsages(input),
    'metadata.findings': (input: ReportInput) => getMetadataFindings(input),
} as const;

export type ReportProviderName = keyof typeof REPORT_PROVIDERS;
