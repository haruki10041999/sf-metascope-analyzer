import type { XmlResolvedError } from '../../../parser/commons';
import type { MetadataFileParseResult } from '../../../parser/Metadata/folder';
import type {
    MutingPermissionSetParseResult,
    PermissionSetGroupParseResult,
    PermissionSetParseResult,
    ProfileParseResult,
} from '../../../parser/Metadata/permission';
import type { CustomLabelsParseResult } from '../../../parser/Metadata/customLabels';
import type { FlowParseResult } from '../../../parser/Metadata/flow';
import type { FlexiPageParseResult, LayoutParseResult } from '../../../parser/Metadata/page';
import type * as Records from '../../../parser/Metadata/record';
import { RECORD_METADATA_SPECS, type RecordSpec } from '../../../types';

import { Match, Sources } from '../../commons/diff/commons';
import { IdUnitDiff, makeIdUnitDiffs } from '../../commons/diff/unit';
import {
    MutingPermissionSetJsonDiff,
    PermissionSetGroupJsonDiff,
    PermissionSetJsonDiff,
    ProfileJsonDiff,
    makeMutingPermissionSetDiff,
    makePermissionSetDiff,
    makePermissionSetGroupDiff,
    makeProfileDiff,
} from './permission';
import { CustomLabelsJsonDiff, makeCustomLabelsDiff } from './customLabels';
import { FlowJsonDiff, makeFlowDiff } from './flow';
import {
    ApexComponentJsonDiff,
    ApexPageJsonDiff,
    AuraBundleJsonDiff,
    EmailTemplateJsonDiff,
    RecordJsonDiff,
    makeApexComponentDiff,
    makeApexPageDiff,
    makeAuraBundleDiff,
    makeEmailTemplateDiff,
    makeRecordDiff,
} from './record';
import { FlexiPageJsonDiff, LayoutJsonDiff, makeFlexiPageDiff, makeLayoutDiff } from './page';

// フォルダ単位のメタデータ (権限・ラベル・Flow・画面) の、ファイル (単位) ごとの差分。
// 単位は id (<種類>_<名前>) で対応付ける (processor/commons/diff/unit.ts の makeIdUnitDiffs)

type FileResult = MetadataFileParseResult & { resolvedError: XmlResolvedError[] };

/** ファイル 1 つの差分 */
export type MetadataFileUnitDiff<R extends FileResult, Content> = IdUnitDiff<R, Content>;

/** 種類ごとの、ファイルの一覧同士の差分を作る関数 (id の順に並べる) */
const makeUnitDiffs =
    <R extends FileResult, J, Content>(
        dataType: Exclude<R['dataType'], 'error'>,
        makeDiff: (before: J, after: J, match: Match, sources: Sources) => Content,
    ) =>
    (before: R[], after: R[]): MetadataFileUnitDiff<R, Content>[] =>
        makeIdUnitDiffs(before, after, {
            dataType,
            make: (b, a, sources) => makeDiff(b as J, a as J, 'key', sources),
        });

export type PermissionSetUnitDiff = MetadataFileUnitDiff<
    PermissionSetParseResult,
    PermissionSetJsonDiff
>;
export type MutingPermissionSetUnitDiff = MetadataFileUnitDiff<
    MutingPermissionSetParseResult,
    MutingPermissionSetJsonDiff
>;
export type ProfileUnitDiff = MetadataFileUnitDiff<ProfileParseResult, ProfileJsonDiff>;
export type PermissionSetGroupUnitDiff = MetadataFileUnitDiff<
    PermissionSetGroupParseResult,
    PermissionSetGroupJsonDiff
>;

export const makePermissionSetUnitDiffs = makeUnitDiffs<
    PermissionSetParseResult,
    Parameters<typeof makePermissionSetDiff>[0],
    PermissionSetJsonDiff
>('permissionSet', makePermissionSetDiff);

export const makeMutingPermissionSetUnitDiffs = makeUnitDiffs<
    MutingPermissionSetParseResult,
    Parameters<typeof makeMutingPermissionSetDiff>[0],
    MutingPermissionSetJsonDiff
>('mutingPermissionSet', makeMutingPermissionSetDiff);

export const makeProfileUnitDiffs = makeUnitDiffs<
    ProfileParseResult,
    Parameters<typeof makeProfileDiff>[0],
    ProfileJsonDiff
>('profile', makeProfileDiff);

export const makePermissionSetGroupUnitDiffs = makeUnitDiffs<
    PermissionSetGroupParseResult,
    Parameters<typeof makePermissionSetGroupDiff>[0],
    PermissionSetGroupJsonDiff
>('permissionSetGroup', (b, a, match) => makePermissionSetGroupDiff(b, a, match));

export type CustomLabelsUnitDiff = MetadataFileUnitDiff<
    CustomLabelsParseResult,
    CustomLabelsJsonDiff
>;

export const makeCustomLabelsUnitDiffs = makeUnitDiffs<
    CustomLabelsParseResult,
    Parameters<typeof makeCustomLabelsDiff>[0],
    CustomLabelsJsonDiff
>('customLabels', makeCustomLabelsDiff);

export type FlowUnitDiff = MetadataFileUnitDiff<FlowParseResult, FlowJsonDiff>;

export const makeFlowUnitDiffs = makeUnitDiffs<
    FlowParseResult,
    Parameters<typeof makeFlowDiff>[0],
    FlowJsonDiff
>('flow', makeFlowDiff);

export type LayoutUnitDiff = MetadataFileUnitDiff<LayoutParseResult, LayoutJsonDiff>;
export type FlexiPageUnitDiff = MetadataFileUnitDiff<FlexiPageParseResult, FlexiPageJsonDiff>;

export const makeLayoutUnitDiffs = makeUnitDiffs<
    LayoutParseResult,
    Parameters<typeof makeLayoutDiff>[0],
    LayoutJsonDiff
>('layout', makeLayoutDiff);

export const makeFlexiPageUnitDiffs = makeUnitDiffs<
    FlexiPageParseResult,
    Parameters<typeof makeFlexiPageDiff>[0],
    FlexiPageJsonDiff
>('flexiPage', makeFlexiPageDiff);

// ---------------------------------------------------------------------------
// 優先度 B・C (docs/metadata-implementation.md) 10 章
// ---------------------------------------------------------------------------

/** 表 (recordTypes.ts) の種類の単位の差分 */
const recordUnitDiffs = <R extends FileResult, S extends RecordSpec>(
    dataType: Exclude<R['dataType'], 'error'>,
    spec: S,
) =>
    makeUnitDiffs<R, Parameters<ReturnType<typeof makeRecordDiff<S>>>[0], RecordJsonDiff<S>>(
        dataType,
        makeRecordDiff(spec),
    );

const S = RECORD_METADATA_SPECS;

export const makeCustomMetadataRecordUnitDiffs = recordUnitDiffs<
    Records.CustomMetadataRecordParseResult,
    typeof S.customMetadata
>('customMetadata', S.customMetadata);
export const makeCustomTabUnitDiffs = recordUnitDiffs<
    Records.CustomTabParseResult,
    typeof S.customTab
>('customTab', S.customTab);
export const makeCustomApplicationUnitDiffs = recordUnitDiffs<
    Records.CustomApplicationParseResult,
    typeof S.customApplication
>('customApplication', S.customApplication);
export const makeGlobalValueSetUnitDiffs = recordUnitDiffs<
    Records.GlobalValueSetParseResult,
    typeof S.globalValueSet
>('globalValueSet', S.globalValueSet);
export const makeStandardValueSetUnitDiffs = recordUnitDiffs<
    Records.StandardValueSetParseResult,
    typeof S.standardValueSet
>('standardValueSet', S.standardValueSet);
export const makeCustomPermissionUnitDiffs = recordUnitDiffs<
    Records.CustomPermissionParseResult,
    typeof S.customPermission
>('customPermission', S.customPermission);
export const makeQuickActionUnitDiffs = recordUnitDiffs<
    Records.QuickActionParseResult,
    typeof S.quickAction
>('quickAction', S.quickAction);
export const makeSharingRulesUnitDiffs = recordUnitDiffs<
    Records.SharingRulesParseResult,
    typeof S.sharingRules
>('sharingRules', S.sharingRules);
export const makeStaticResourceUnitDiffs = recordUnitDiffs<
    Records.StaticResourceParseResult,
    typeof S.staticResource
>('staticResource', S.staticResource);
export const makeReportUnitDiffs = recordUnitDiffs<Records.ReportParseResult, typeof S.report>(
    'report',
    S.report,
);
export const makeDashboardUnitDiffs = recordUnitDiffs<
    Records.DashboardParseResult,
    typeof S.dashboard
>('dashboard', S.dashboard);
export const makeTranslationsUnitDiffs = recordUnitDiffs<
    Records.TranslationsParseResult,
    typeof S.translations
>('translations', S.translations);
export const makeNamedCredentialUnitDiffs = recordUnitDiffs<
    Records.NamedCredentialParseResult,
    typeof S.namedCredential
>('namedCredential', S.namedCredential);
export const makeRemoteSiteSettingUnitDiffs = recordUnitDiffs<
    Records.RemoteSiteSettingParseResult,
    typeof S.remoteSiteSetting
>('remoteSiteSetting', S.remoteSiteSetting);
export const makeWorkflowUnitDiffs = recordUnitDiffs<
    Records.WorkflowParseResult,
    typeof S.workflow
>('workflow', S.workflow);
export const makeApprovalProcessUnitDiffs = recordUnitDiffs<
    Records.ApprovalProcessParseResult,
    typeof S.approvalProcess
>('approvalProcess', S.approvalProcess);
export const makeQueueUnitDiffs = recordUnitDiffs<Records.QueueParseResult, typeof S.queue>(
    'queue',
    S.queue,
);
export const makeGroupUnitDiffs = recordUnitDiffs<Records.GroupParseResult, typeof S.group>(
    'group',
    S.group,
);
export const makeRoleUnitDiffs = recordUnitDiffs<Records.RoleParseResult, typeof S.role>(
    'role',
    S.role,
);

export const makeLightningMessageChannelUnitDiffs = recordUnitDiffs<
    Records.LightningMessageChannelParseResult,
    typeof S.messageChannel
>('messageChannel', S.messageChannel);
export const makeExternalCredentialUnitDiffs = recordUnitDiffs<
    Records.ExternalCredentialParseResult,
    typeof S.externalCredential
>('externalCredential', S.externalCredential);
export const makeCustomNotificationTypeUnitDiffs = recordUnitDiffs<
    Records.CustomNotificationTypeParseResult,
    typeof S.customNotificationType
>('customNotificationType', S.customNotificationType);
export const makeReportTypeUnitDiffs = recordUnitDiffs<
    Records.ReportTypeParseResult,
    typeof S.reportType
>('reportType', S.reportType);

export const makeApexPageUnitDiffs = makeUnitDiffs<
    Records.ApexPageParseResult,
    Parameters<typeof makeApexPageDiff>[0],
    ApexPageJsonDiff
>('apexPage', makeApexPageDiff);
export const makeApexComponentUnitDiffs = makeUnitDiffs<
    Records.ApexComponentParseResult,
    Parameters<typeof makeApexComponentDiff>[0],
    ApexComponentJsonDiff
>('apexComponent', makeApexComponentDiff);
export const makeEmailTemplateUnitDiffs = makeUnitDiffs<
    Records.EmailTemplateParseResult,
    Parameters<typeof makeEmailTemplateDiff>[0],
    EmailTemplateJsonDiff
>('emailTemplate', makeEmailTemplateDiff);
export const makeAuraUnitDiffs = makeUnitDiffs<
    Records.AuraParseResult,
    Parameters<typeof makeAuraBundleDiff>[0],
    AuraBundleJsonDiff
>('aura', makeAuraBundleDiff);

/** 単位の差分を作る関数 (種類を問わない形。一覧用) */
export type AnyUnitDiffs = (
    before: MetadataFileParseResult[],
    after: MetadataFileParseResult[],
) => MetadataFileUnitDiff<FileResult, unknown>[];

/** フォルダ単位のメタデータの種類 → 単位の差分 (dataType で選ぶ。run-folders.ts・テストで使う) */
export const METADATA_UNIT_DIFFS: Record<string, AnyUnitDiffs> = {
    permissionSet: makePermissionSetUnitDiffs,
    mutingPermissionSet: makeMutingPermissionSetUnitDiffs,
    profile: makeProfileUnitDiffs,
    permissionSetGroup: makePermissionSetGroupUnitDiffs,
    customLabels: makeCustomLabelsUnitDiffs,
    flow: makeFlowUnitDiffs,
    layout: makeLayoutUnitDiffs,
    flexiPage: makeFlexiPageUnitDiffs,
    customMetadata: makeCustomMetadataRecordUnitDiffs,
    customTab: makeCustomTabUnitDiffs,
    customApplication: makeCustomApplicationUnitDiffs,
    globalValueSet: makeGlobalValueSetUnitDiffs,
    standardValueSet: makeStandardValueSetUnitDiffs,
    customPermission: makeCustomPermissionUnitDiffs,
    quickAction: makeQuickActionUnitDiffs,
    sharingRules: makeSharingRulesUnitDiffs,
    apexPage: makeApexPageUnitDiffs,
    apexComponent: makeApexComponentUnitDiffs,
    aura: makeAuraUnitDiffs,
    staticResource: makeStaticResourceUnitDiffs,
    emailTemplate: makeEmailTemplateUnitDiffs,
    report: makeReportUnitDiffs,
    dashboard: makeDashboardUnitDiffs,
    translations: makeTranslationsUnitDiffs,
    namedCredential: makeNamedCredentialUnitDiffs,
    remoteSiteSetting: makeRemoteSiteSettingUnitDiffs,
    workflow: makeWorkflowUnitDiffs,
    approvalProcess: makeApprovalProcessUnitDiffs,
    queue: makeQueueUnitDiffs,
    group: makeGroupUnitDiffs,
    role: makeRoleUnitDiffs,
    messageChannel: makeLightningMessageChannelUnitDiffs,
    externalCredential: makeExternalCredentialUnitDiffs,
    customNotificationType: makeCustomNotificationTypeUnitDiffs,
    reportType: makeReportTypeUnitDiffs,
} as Record<string, unknown> as Record<string, AnyUnitDiffs>;
