import {
    AURA_BUNDLE_TYPES,
    RECORD_METADATA_SPECS,
    makeApexComponentJson,
    makeApexPageJson,
    makeAuraBundleJson,
    makeEmailTemplateJson,
    makeRecordJson,
    type RecordMetadataType,
} from '../../types';
import { MetadataFolderParser } from './folder';
import type { ParseResultOf } from './permission';

// 優先度 B・C のメタデータの parser。方針: docs/metadata-b-c-plan.md

/** XML 1 ファイルの種類のフォルダ・接尾辞 (JSON の作り方は types/metadata/recordTypes.ts の表) */
const RECORD_FOLDERS: Record<
    RecordMetadataType,
    { folder: string; suffix: string; layout?: 'nested' }
> = {
    customMetadata: { folder: 'customMetadata', suffix: '.md-meta.xml' },
    customTab: { folder: 'tabs', suffix: '.tab-meta.xml' },
    customApplication: { folder: 'applications', suffix: '.app-meta.xml' },
    globalValueSet: { folder: 'globalValueSets', suffix: '.globalValueSet-meta.xml' },
    standardValueSet: { folder: 'standardValueSets', suffix: '.standardValueSet-meta.xml' },
    customPermission: { folder: 'customPermissions', suffix: '.customPermission-meta.xml' },
    quickAction: { folder: 'quickActions', suffix: '.quickAction-meta.xml' },
    sharingRules: { folder: 'sharingRules', suffix: '.sharingRules-meta.xml' },
    staticResource: { folder: 'staticresources', suffix: '.resource-meta.xml' },
    report: { folder: 'reports', suffix: '.report-meta.xml', layout: 'nested' },
    dashboard: { folder: 'dashboards', suffix: '.dashboard-meta.xml', layout: 'nested' },
    translations: { folder: 'translations', suffix: '.translation-meta.xml' },
    namedCredential: { folder: 'namedCredentials', suffix: '.namedCredential-meta.xml' },
    remoteSiteSetting: { folder: 'remoteSiteSettings', suffix: '.remoteSite-meta.xml' },
    workflow: { folder: 'workflows', suffix: '.workflow-meta.xml' },
    approvalProcess: { folder: 'approvalProcesses', suffix: '.approvalProcess-meta.xml' },
    queue: { folder: 'queues', suffix: '.queue-meta.xml' },
    group: { folder: 'groups', suffix: '.group-meta.xml' },
    role: { folder: 'roles', suffix: '.role-meta.xml' },
};

const recordParser = <T extends RecordMetadataType>(type: T) =>
    new MetadataFolderParser({
        type,
        ...RECORD_FOLDERS[type],
        make: makeRecordJson(RECORD_METADATA_SPECS[type]),
    });

export const CustomMetadataRecordParser = recordParser('customMetadata');
export const CustomTabParser = recordParser('customTab');
export const CustomApplicationParser = recordParser('customApplication');
export const GlobalValueSetParser = recordParser('globalValueSet');
export const StandardValueSetParser = recordParser('standardValueSet');
export const CustomPermissionParser = recordParser('customPermission');
export const QuickActionParser = recordParser('quickAction');
export const SharingRulesParser = recordParser('sharingRules');
export const StaticResourceParser = recordParser('staticResource');
export const ReportParser = recordParser('report');
export const DashboardParser = recordParser('dashboard');
export const TranslationsParser = recordParser('translations');
export const NamedCredentialParser = recordParser('namedCredential');
export const RemoteSiteSettingParser = recordParser('remoteSiteSetting');
export const WorkflowParser = recordParser('workflow');
export const ApprovalProcessParser = recordParser('approvalProcess');
export const QueueParser = recordParser('queue');
export const GroupParser = recordParser('group');
export const RoleParser = recordParser('role');

/** Visualforce ページ (pages/<名前>.page-meta.xml と <名前>.page) */
export const ApexPageParser = new MetadataFolderParser({
    type: 'apexPage',
    folder: 'pages',
    suffix: '.page-meta.xml',
    companions: ['.page'],
    make: makeApexPageJson,
});

/** Visualforce コンポーネント (components/<名前>.component-meta.xml と <名前>.component) */
export const ApexComponentParser = new MetadataFolderParser({
    type: 'apexComponent',
    folder: 'components',
    suffix: '.component-meta.xml',
    companions: ['.component'],
    make: makeApexComponentJson,
});

/** メールテンプレート (email/<フォルダ>/<名前>.email-meta.xml と <名前>.email) */
export const EmailTemplateParser = new MetadataFolderParser({
    type: 'emailTemplate',
    folder: 'email',
    suffix: '.email-meta.xml',
    layout: 'nested',
    companions: ['.email'],
    make: makeEmailTemplateJson,
});

/** Aura のバンドル (aura/<名前>/) */
export const AuraParser = new MetadataFolderParser({
    type: 'aura',
    folder: 'aura',
    suffix: '',
    layout: 'bundle',
    bundleMain: AURA_BUNDLE_TYPES,
    make: makeAuraBundleJson,
});

export type CustomMetadataRecordParseResult = ParseResultOf<typeof CustomMetadataRecordParser>;
export type CustomTabParseResult = ParseResultOf<typeof CustomTabParser>;
export type CustomApplicationParseResult = ParseResultOf<typeof CustomApplicationParser>;
export type GlobalValueSetParseResult = ParseResultOf<typeof GlobalValueSetParser>;
export type StandardValueSetParseResult = ParseResultOf<typeof StandardValueSetParser>;
export type CustomPermissionParseResult = ParseResultOf<typeof CustomPermissionParser>;
export type QuickActionParseResult = ParseResultOf<typeof QuickActionParser>;
export type SharingRulesParseResult = ParseResultOf<typeof SharingRulesParser>;
export type StaticResourceParseResult = ParseResultOf<typeof StaticResourceParser>;
export type ReportParseResult = ParseResultOf<typeof ReportParser>;
export type DashboardParseResult = ParseResultOf<typeof DashboardParser>;
export type TranslationsParseResult = ParseResultOf<typeof TranslationsParser>;
export type NamedCredentialParseResult = ParseResultOf<typeof NamedCredentialParser>;
export type RemoteSiteSettingParseResult = ParseResultOf<typeof RemoteSiteSettingParser>;
export type WorkflowParseResult = ParseResultOf<typeof WorkflowParser>;
export type ApprovalProcessParseResult = ParseResultOf<typeof ApprovalProcessParser>;
export type QueueParseResult = ParseResultOf<typeof QueueParser>;
export type GroupParseResult = ParseResultOf<typeof GroupParser>;
export type RoleParseResult = ParseResultOf<typeof RoleParser>;
export type ApexPageParseResult = ParseResultOf<typeof ApexPageParser>;
export type ApexComponentParseResult = ParseResultOf<typeof ApexComponentParser>;
export type EmailTemplateParseResult = ParseResultOf<typeof EmailTemplateParser>;
export type AuraParseResult = ParseResultOf<typeof AuraParser>;
