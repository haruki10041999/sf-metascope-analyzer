import type { RecordChildJson, RecordJson, RecordSpec } from './record';

// 優先度 B・C の XML の種類の表と型。方針: docs/metadata-implementation.md 10 章
// 表にない要素は skippedElements に残る (読んでいない要素が分かるように)。足すときは表に 1 行足す

// ---------------------------------------------------------------------------
// B
// ---------------------------------------------------------------------------

/** カスタムメタデータのレコード (customMetadata/<型>.<レコード>.md-meta.xml) */
export const CUSTOM_METADATA_RECORD_SPEC = {
    kind: 'customMetadataRecord',
    root: 'CustomMetadata',
    schema: { label: 'string', protected: 'boolean', description: 'string' },
    children: {
        values: {
            kind: 'customMetadataValue',
            key: ['field'],
            schema: { field: 'string' },
            // 値は xsi:type / xsi:nil の属性を持つので、値の木 ({ '#text', '@xsi:type' })
            trees: { value: 'one' },
        },
    },
} as const satisfies RecordSpec;
export type CustomMetadataRecordJson = RecordJson<typeof CUSTOM_METADATA_RECORD_SPEC>;

/** タブ (tabs/<名前>.tab-meta.xml) */
export const CUSTOM_TAB_SPEC = {
    kind: 'customTab',
    root: 'CustomTab',
    schema: {
        label: 'string',
        description: 'string',
        customObject: 'boolean',
        motif: 'string',
        lwcComponent: 'string',
        auraComponent: 'string',
        page: 'string',
        flexiPage: 'string',
        url: 'string',
        urlEncodingKey: 'string',
        frameHeight: 'number',
        hasSidebar: 'boolean',
        mobileReady: 'boolean',
        splashPageLink: 'string',
        icon: 'string',
    },
} as const satisfies RecordSpec;
export type CustomTabJson = RecordJson<typeof CUSTOM_TAB_SPEC>;

const APP_ACTION_OVERRIDE_SCHEMA = {
    actionName: 'string',
    comment: 'string',
    content: 'string',
    formFactor: 'string',
    pageOrSobjectType: 'string',
    recordType: 'string',
    skipRecordTypeSelect: 'boolean',
    type: 'string',
} as const;

/** アプリ (applications/<名前>.app-meta.xml) */
export const CUSTOM_APPLICATION_SPEC = {
    kind: 'customApplication',
    root: 'CustomApplication',
    schema: {
        label: 'string',
        description: 'string',
        navType: 'string',
        uiType: 'string',
        defaultLandingTab: 'string',
        logo: 'string',
        setupExperience: 'string',
        utilityBar: 'string',
        isNavAutoTempTabsDisabled: 'boolean',
        isNavPersonalizationDisabled: 'boolean',
        isNavTabPersistenceDisabled: 'boolean',
        isOverrideOrgTheme: 'boolean',
    },
    /** タブ (表示順)・フォームファクター */
    lists: ['tabs', 'formFactors'],
    trees: { brand: 'one', consoleConfig: 'one', workspaceConfig: 'one' },
    children: {
        actionOverrides: {
            kind: 'appActionOverride',
            key: ['actionName', 'pageOrSobjectType', 'formFactor'],
            schema: APP_ACTION_OVERRIDE_SCHEMA,
        },
        profileActionOverrides: {
            kind: 'appProfileActionOverride',
            key: ['actionName', 'pageOrSobjectType', 'recordType', 'profile', 'formFactor'],
            schema: { ...APP_ACTION_OVERRIDE_SCHEMA, profile: 'string' },
        },
    },
} as const satisfies RecordSpec;
export type CustomApplicationJson = RecordJson<typeof CUSTOM_APPLICATION_SPEC>;

const VALUE_SCHEMA = {
    fullName: 'string',
    label: 'string',
    default: 'boolean',
    isActive: 'boolean',
    color: 'string',
    description: 'string',
} as const;

/** グローバル値セット (globalValueSets/<名前>.globalValueSet-meta.xml) */
export const GLOBAL_VALUE_SET_SPEC = {
    kind: 'globalValueSet',
    root: 'GlobalValueSet',
    schema: { masterLabel: 'string', description: 'string', sorted: 'boolean' },
    children: {
        customValue: { kind: 'globalValue', key: ['fullName'], schema: VALUE_SCHEMA },
    },
} as const satisfies RecordSpec;
export type GlobalValueSetJson = RecordJson<typeof GLOBAL_VALUE_SET_SPEC>;
export type GlobalValueJson = RecordChildJson<typeof GLOBAL_VALUE_SET_SPEC.children.customValue>;

/** 標準値セット (standardValueSets/<名前>.standardValueSet-meta.xml) */
export const STANDARD_VALUE_SET_SPEC = {
    kind: 'standardValueSet',
    root: 'StandardValueSet',
    schema: { sorted: 'boolean', groupingStringEnum: 'string' },
    children: {
        standardValue: {
            kind: 'standardValue',
            key: ['fullName'],
            schema: {
                ...VALUE_SCHEMA,
                closed: 'boolean',
                converted: 'boolean',
                won: 'boolean',
                highPriority: 'boolean',
                cssExposed: 'boolean',
                probability: 'number',
                forecastCategory: 'string',
                reverseRole: 'string',
            },
            lists: ['groupingString'],
        },
    },
} as const satisfies RecordSpec;
export type StandardValueSetJson = RecordJson<typeof STANDARD_VALUE_SET_SPEC>;

/** カスタム権限 (customPermissions/<名前>.customPermission-meta.xml) */
export const CUSTOM_PERMISSION_SPEC = {
    kind: 'customPermission',
    root: 'CustomPermission',
    schema: {
        label: 'string',
        description: 'string',
        isLicensed: 'boolean',
        connectedApp: 'string',
    },
    children: {
        requiredPermission: {
            kind: 'requiredPermission',
            key: ['customPermission'],
            schema: { customPermission: 'string', dependency: 'boolean' },
        },
    },
} as const satisfies RecordSpec;
export type CustomPermissionJson = RecordJson<typeof CUSTOM_PERMISSION_SPEC>;

/** クイックアクション (quickActions/<名前>.quickAction-meta.xml) */
export const QUICK_ACTION_SPEC = {
    kind: 'quickAction',
    root: 'QuickAction',
    schema: {
        label: 'string',
        description: 'string',
        type: 'string',
        standardLabel: 'string',
        targetObject: 'string',
        targetParentField: 'string',
        targetRecordType: 'string',
        lightningComponent: 'string',
        lightningWebComponent: 'string',
        flowDefinition: 'string',
        page: 'string',
        canvas: 'string',
        icon: 'string',
        height: 'number',
        width: 'number',
        successMessage: 'string',
        optionsCreateFeedItem: 'boolean',
        mobileExtension: 'string',
    },
    /** レイアウト (セクション・列・項目) と、メールの送信の設定 */
    trees: { quickActionLayout: 'one', quickActionSendEmailOptions: 'one' },
    children: {
        fieldOverrides: {
            kind: 'quickActionFieldOverride',
            key: ['field'],
            schema: { field: 'string', formula: 'string', literalValue: 'string' },
        },
    },
} as const satisfies RecordSpec;
export type QuickActionJson = RecordJson<typeof QUICK_ACTION_SPEC>;

const SHARING_RULE_SCHEMA = {
    fullName: 'string',
    label: 'string',
    description: 'string',
    accessLevel: 'string',
} as const;

/** 共有ルール (sharingRules/<オブジェクト>.sharingRules-meta.xml) */
export const SHARING_RULES_SPEC = {
    kind: 'sharingRules',
    root: 'SharingRules',
    schema: {},
    children: {
        sharingCriteriaRules: {
            kind: 'sharingCriteriaRule',
            key: ['fullName'],
            schema: {
                ...SHARING_RULE_SCHEMA,
                booleanFilter: 'string',
                includeRecordsOwnedByAll: 'boolean',
            },
            trees: { sharedTo: 'one', criteriaItems: 'many', accountSettings: 'one' },
        },
        sharingOwnerRules: {
            kind: 'sharingOwnerRule',
            key: ['fullName'],
            schema: SHARING_RULE_SCHEMA,
            trees: { sharedTo: 'one', sharedFrom: 'one', accountSettings: 'one' },
        },
        sharingGuestRules: {
            kind: 'sharingGuestRule',
            key: ['fullName'],
            schema: {
                ...SHARING_RULE_SCHEMA,
                booleanFilter: 'string',
                includeHVUOwnedRecords: 'boolean',
            },
            trees: { sharedTo: 'one', criteriaItems: 'many' },
        },
        sharingTerritoryRules: {
            kind: 'sharingTerritoryRule',
            key: ['fullName'],
            schema: SHARING_RULE_SCHEMA,
            trees: { sharedTo: 'one', sharedFrom: 'one', accountSettings: 'one' },
        },
    },
} as const satisfies RecordSpec;
export type SharingRulesJson = RecordJson<typeof SHARING_RULES_SPEC>;

/** Visualforce ページの -meta.xml (pages/<名前>.page-meta.xml) */
export const APEX_PAGE_META_SPEC = {
    kind: 'apexPage',
    root: 'ApexPage',
    schema: {
        apiVersion: 'string',
        label: 'string',
        description: 'string',
        availableInTouch: 'boolean',
        confirmationTokenRequired: 'boolean',
    },
    trees: { packageVersions: 'many' },
} as const satisfies RecordSpec;

/** Visualforce コンポーネントの -meta.xml (components/<名前>.component-meta.xml) */
export const APEX_COMPONENT_META_SPEC = {
    kind: 'apexComponent',
    root: 'ApexComponent',
    schema: { apiVersion: 'string', label: 'string', description: 'string' },
    trees: { packageVersions: 'many' },
} as const satisfies RecordSpec;

/** Aura のバンドルの -meta.xml (<名前>.cmp-meta.xml など) */
export const AURA_DEFINITION_BUNDLE_SPEC = {
    kind: 'auraDefinitionBundle',
    root: 'AuraDefinitionBundle',
    schema: { apiVersion: 'string', description: 'string' },
    trees: { packageVersions: 'many' },
} as const satisfies RecordSpec;
export type AuraDefinitionBundleJson = RecordJson<typeof AURA_DEFINITION_BUNDLE_SPEC>;

// ---------------------------------------------------------------------------
// C
// ---------------------------------------------------------------------------

/** 静的リソース (staticresources/<名前>.resource-meta.xml) */
export const STATIC_RESOURCE_SPEC = {
    kind: 'staticResource',
    root: 'StaticResource',
    schema: { cacheControl: 'string', contentType: 'string', description: 'string' },
} as const satisfies RecordSpec;
export type StaticResourceJson = RecordJson<typeof STATIC_RESOURCE_SPEC>;

/** メールテンプレートの -meta.xml (email/<フォルダ>/<名前>.email-meta.xml) */
export const EMAIL_TEMPLATE_META_SPEC = {
    kind: 'emailTemplate',
    root: 'EmailTemplate',
    schema: {
        name: 'string',
        description: 'string',
        subject: 'string',
        type: 'string',
        style: 'string',
        uiType: 'string',
        encodingKey: 'string',
        available: 'boolean',
        apiVersion: 'string',
        relatedEntityType: 'string',
        letterhead: 'string',
        textOnly: 'string',
    },
    lists: ['attachedDocuments'],
    trees: { attachments: 'many', packageVersions: 'many' },
} as const satisfies RecordSpec;

/** レポート (reports/<フォルダ>/<名前>.report-meta.xml) */
export const REPORT_SPEC = {
    kind: 'report',
    root: 'Report',
    schema: {
        name: 'string',
        description: 'string',
        format: 'string',
        reportType: 'string',
        scope: 'string',
        currency: 'string',
        sortColumn: 'string',
        sortOrder: 'string',
        rowLimit: 'number',
        showDetails: 'boolean',
        showGrandTotal: 'boolean',
        showSubTotals: 'boolean',
    },
    trees: {
        filter: 'one',
        timeFrameFilter: 'one',
        chart: 'one',
        groupingsDown: 'many',
        groupingsAcross: 'many',
        aggregates: 'many',
        params: 'many',
        crossFilters: 'many',
        buckets: 'many',
        formattingRules: 'many',
    },
    children: {
        columns: {
            kind: 'reportColumn',
            key: ['field'],
            schema: { field: 'string', reverseColors: 'boolean', showChanges: 'boolean' },
            lists: ['aggregateTypes'],
        },
    },
} as const satisfies RecordSpec;
export type ReportJson = RecordJson<typeof REPORT_SPEC>;

/** ダッシュボード (dashboards/<フォルダ>/<名前>.dashboard-meta.xml)。部品の並びは値の木 */
export const DASHBOARD_SPEC = {
    kind: 'dashboard',
    root: 'Dashboard',
    schema: {
        title: 'string',
        description: 'string',
        dashboardType: 'string',
        runningUser: 'string',
        backgroundStartColor: 'string',
        backgroundEndColor: 'string',
        backgroundFadeDirection: 'string',
        textColor: 'string',
        titleColor: 'string',
        titleSize: 'number',
        chartTheme: 'string',
        colorPalette: 'string',
        isGridLayout: 'boolean',
        numSubscriptions: 'number',
    },
    trees: {
        leftSection: 'one',
        middleSection: 'one',
        rightSection: 'one',
        dashboardGridLayout: 'one',
        dashboardFilters: 'many',
    },
} as const satisfies RecordSpec;
export type DashboardJson = RecordJson<typeof DASHBOARD_SPEC>;

const NAME_LABEL = { name: 'string', label: 'string', description: 'string' } as const;

/** 組織全体の翻訳 (translations/<言語>.translation-meta.xml) */
export const TRANSLATIONS_SPEC = {
    kind: 'translations',
    root: 'Translations',
    schema: {},
    children: {
        customLabels: { kind: 'labelTranslation', key: ['name'], schema: NAME_LABEL },
        customTabs: { kind: 'tabTranslation', key: ['name'], schema: NAME_LABEL },
        customApplications: {
            kind: 'applicationTranslation',
            key: ['name'],
            schema: NAME_LABEL,
        },
        quickActions: {
            kind: 'quickActionTranslation',
            key: ['name'],
            schema: { ...NAME_LABEL, aspect: 'string' },
        },
        flowDefinitions: {
            kind: 'flowTranslation',
            key: ['fullName'],
            schema: { fullName: 'string', label: 'string' },
            trees: { flows: 'many' },
        },
        reportTypes: {
            kind: 'reportTypeTranslation',
            key: ['name'],
            schema: NAME_LABEL,
            trees: { sections: 'many' },
        },
        customPageWebLinks: { kind: 'webLinkTranslation', key: ['name'], schema: NAME_LABEL },
    },
} as const satisfies RecordSpec;
export type TranslationsJson = RecordJson<typeof TRANSLATIONS_SPEC>;

/** 指定ログイン情報 (namedCredentials/<名前>.namedCredential-meta.xml) */
export const NAMED_CREDENTIAL_SPEC = {
    kind: 'namedCredential',
    root: 'NamedCredential',
    schema: {
        label: 'string',
        description: 'string',
        endpoint: 'string',
        principalType: 'string',
        protocol: 'string',
        namedCredentialType: 'string',
        authProvider: 'string',
        certificate: 'string',
        oauthScope: 'string',
        username: 'string',
        calloutStatus: 'string',
        allowMergeFieldsInBody: 'boolean',
        allowMergeFieldsInHeader: 'boolean',
        generateAuthorizationHeader: 'boolean',
    },
    children: {
        namedCredentialParameters: {
            kind: 'namedCredentialParameter',
            key: ['parameterName', 'parameterType'],
            schema: {
                parameterName: 'string',
                parameterType: 'string',
                parameterValue: 'string',
                externalCredential: 'string',
                certificate: 'string',
                description: 'string',
                sequenceNumber: 'number',
            },
        },
    },
} as const satisfies RecordSpec;
export type NamedCredentialJson = RecordJson<typeof NAMED_CREDENTIAL_SPEC>;

/** リモートサイト (remoteSiteSettings/<名前>.remoteSite-meta.xml) */
export const REMOTE_SITE_SETTING_SPEC = {
    kind: 'remoteSiteSetting',
    root: 'RemoteSiteSetting',
    schema: {
        url: 'string',
        description: 'string',
        isActive: 'boolean',
        disableProtocolSecurity: 'boolean',
    },
} as const satisfies RecordSpec;
export type RemoteSiteSettingJson = RecordJson<typeof REMOTE_SITE_SETTING_SPEC>;

/** ワークフロー (workflows/<オブジェクト>.workflow-meta.xml) */
export const WORKFLOW_SPEC = {
    kind: 'workflow',
    root: 'Workflow',
    schema: {},
    children: {
        alerts: {
            kind: 'workflowAlert',
            key: ['fullName'],
            schema: {
                fullName: 'string',
                description: 'string',
                protected: 'boolean',
                senderType: 'string',
                senderAddress: 'string',
                template: 'string',
            },
            lists: ['ccEmails'],
            trees: { recipients: 'many' },
        },
        fieldUpdates: {
            kind: 'workflowFieldUpdate',
            key: ['fullName'],
            schema: {
                fullName: 'string',
                name: 'string',
                description: 'string',
                field: 'string',
                literalValue: 'string',
                formula: 'string',
                lookupValue: 'string',
                lookupValueType: 'string',
                operation: 'string',
                targetObject: 'string',
                notifyAssignee: 'boolean',
                protected: 'boolean',
                reevaluateOnChange: 'boolean',
            },
        },
        outboundMessages: {
            kind: 'workflowOutboundMessage',
            key: ['fullName'],
            schema: {
                fullName: 'string',
                name: 'string',
                description: 'string',
                endpointUrl: 'string',
                apiVersion: 'string',
                integrationUser: 'string',
                includeSessionId: 'boolean',
                protected: 'boolean',
                useDeadLetterQueue: 'boolean',
            },
            lists: ['fields'],
        },
        rules: {
            kind: 'workflowRule',
            key: ['fullName'],
            schema: {
                fullName: 'string',
                description: 'string',
                active: 'boolean',
                formula: 'string',
                booleanFilter: 'string',
                triggerType: 'string',
            },
            trees: { actions: 'many', criteriaItems: 'many', workflowTimeTriggers: 'many' },
        },
        tasks: {
            kind: 'workflowTask',
            key: ['fullName'],
            schema: {
                fullName: 'string',
                subject: 'string',
                description: 'string',
                assignedTo: 'string',
                assignedToType: 'string',
                dueDateOffset: 'number',
                offsetFromField: 'string',
                priority: 'string',
                status: 'string',
                notifyAssignee: 'boolean',
                protected: 'boolean',
            },
        },
    },
} as const satisfies RecordSpec;
export type WorkflowJson = RecordJson<typeof WORKFLOW_SPEC>;

/** 承認プロセス (approvalProcesses/<オブジェクト>.<名前>.approvalProcess-meta.xml) */
export const APPROVAL_PROCESS_SPEC = {
    kind: 'approvalProcess',
    root: 'ApprovalProcess',
    schema: {
        label: 'string',
        description: 'string',
        active: 'boolean',
        allowRecall: 'boolean',
        recordEditability: 'string',
        showApprovalHistory: 'boolean',
        finalApprovalRecordLock: 'boolean',
        finalRejectionRecordLock: 'boolean',
        emailTemplate: 'string',
        processOrder: 'number',
    },
    trees: {
        allowedSubmitters: 'many',
        entryCriteria: 'one',
        approvalPageFields: 'one',
        nextAutomatedApprover: 'one',
        finalApprovalActions: 'one',
        finalRejectionActions: 'one',
        initialSubmissionActions: 'one',
        recallActions: 'one',
    },
    children: {
        approvalStep: {
            kind: 'approvalStep',
            key: ['name'],
            schema: {
                name: 'string',
                label: 'string',
                description: 'string',
                allowDelegate: 'boolean',
                rejectBehavior: 'string',
            },
            trees: {
                assignedApprover: 'one',
                entryCriteria: 'one',
                approvalActions: 'one',
                rejectionActions: 'one',
            },
        },
    },
} as const satisfies RecordSpec;
export type ApprovalProcessJson = RecordJson<typeof APPROVAL_PROCESS_SPEC>;

/** キュー (queues/<名前>.queue-meta.xml) */
export const QUEUE_SPEC = {
    kind: 'queue',
    root: 'Queue',
    schema: {
        name: 'string',
        description: 'string',
        email: 'string',
        doesSendEmailToMembers: 'boolean',
    },
    trees: { queueMembers: 'one' },
    children: {
        queueSobject: {
            kind: 'queueSobject',
            key: ['sobjectType'],
            schema: { sobjectType: 'string' },
        },
    },
} as const satisfies RecordSpec;
export type QueueJson = RecordJson<typeof QUEUE_SPEC>;

/** 公開グループ (groups/<名前>.group-meta.xml) */
export const GROUP_SPEC = {
    kind: 'group',
    root: 'Group',
    schema: {
        name: 'string',
        description: 'string',
        doesIncludeBosses: 'boolean',
        doesSendEmailToMembers: 'boolean',
    },
} as const satisfies RecordSpec;
export type GroupJson = RecordJson<typeof GROUP_SPEC>;

/** ロール (roles/<名前>.role-meta.xml) */
export const ROLE_SPEC = {
    kind: 'role',
    root: 'Role',
    schema: {
        name: 'string',
        description: 'string',
        parentRole: 'string',
        caseAccessLevel: 'string',
        contactAccessLevel: 'string',
        opportunityAccessLevel: 'string',
        mayForecastManagerShare: 'boolean',
    },
} as const satisfies RecordSpec;
export type RoleJson = RecordJson<typeof ROLE_SPEC>;

/** メッセージチャネル (messageChannels/<名前>.messageChannel-meta.xml)。LWC は @salesforce/messageChannel/<名前>__c で使う */
export const LIGHTNING_MESSAGE_CHANNEL_SPEC = {
    kind: 'messageChannel',
    root: 'LightningMessageChannel',
    schema: { masterLabel: 'string', description: 'string', isExposed: 'boolean' },
    children: {
        lightningMessageFields: {
            kind: 'messageChannelField',
            key: ['fieldName'],
            schema: { fieldName: 'string', description: 'string' },
        },
    },
} as const satisfies RecordSpec;
export type LightningMessageChannelJson = RecordJson<typeof LIGHTNING_MESSAGE_CHANNEL_SPEC>;

/** 外部ログイン情報 (externalCredentials/<名前>.externalCredential-meta.xml)。指定ログイン情報が指す */
export const EXTERNAL_CREDENTIAL_SPEC = {
    kind: 'externalCredential',
    root: 'ExternalCredential',
    schema: { label: 'string', description: 'string', authenticationProtocol: 'string' },
    children: {
        externalCredentialParameters: {
            kind: 'externalCredentialParameter',
            key: ['parameterName', 'parameterType'],
            schema: {
                parameterName: 'string',
                parameterType: 'string',
                parameterGroup: 'string',
                parameterValue: 'string',
                authProvider: 'string',
                certificate: 'string',
                description: 'string',
                sequenceNumber: 'number',
            },
        },
    },
} as const satisfies RecordSpec;
export type ExternalCredentialJson = RecordJson<typeof EXTERNAL_CREDENTIAL_SPEC>;

/** カスタム通知 (notificationtypes/<名前>.notiftype-meta.xml) */
export const CUSTOM_NOTIFICATION_TYPE_SPEC = {
    kind: 'customNotificationType',
    root: 'CustomNotificationType',
    schema: {
        customNotifTypeName: 'string',
        masterLabel: 'string',
        description: 'string',
        desktop: 'boolean',
        mobile: 'boolean',
        slack: 'boolean',
    },
} as const satisfies RecordSpec;
export type CustomNotificationTypeJson = RecordJson<typeof CUSTOM_NOTIFICATION_TYPE_SPEC>;

/** カスタムレポートタイプ (reportTypes/<名前>.reportType-meta.xml)。レポートの reportType は <名前>__c */
export const REPORT_TYPE_SPEC = {
    kind: 'reportType',
    root: 'ReportType',
    schema: {
        label: 'string',
        description: 'string',
        baseObject: 'string',
        category: 'string',
        deployed: 'boolean',
        autogenerated: 'boolean',
    },
    // join は入れ子 (join の中に join) なので値の木
    trees: { join: 'one' },
    children: {
        sections: {
            kind: 'reportTypeSection',
            key: ['masterLabel'],
            schema: { masterLabel: 'string' },
            // 列 (field・table・checkedByDefault) の並び
            trees: { columns: 'many' },
        },
    },
} as const satisfies RecordSpec;
export type ReportTypeJson = RecordJson<typeof REPORT_TYPE_SPEC>;

/** XML 1 ファイルの種類 (種類 → 表)。parser・Diff の一覧に使う */
export const RECORD_METADATA_SPECS = {
    customMetadata: CUSTOM_METADATA_RECORD_SPEC,
    customTab: CUSTOM_TAB_SPEC,
    customApplication: CUSTOM_APPLICATION_SPEC,
    globalValueSet: GLOBAL_VALUE_SET_SPEC,
    standardValueSet: STANDARD_VALUE_SET_SPEC,
    customPermission: CUSTOM_PERMISSION_SPEC,
    quickAction: QUICK_ACTION_SPEC,
    sharingRules: SHARING_RULES_SPEC,
    staticResource: STATIC_RESOURCE_SPEC,
    report: REPORT_SPEC,
    dashboard: DASHBOARD_SPEC,
    translations: TRANSLATIONS_SPEC,
    namedCredential: NAMED_CREDENTIAL_SPEC,
    remoteSiteSetting: REMOTE_SITE_SETTING_SPEC,
    workflow: WORKFLOW_SPEC,
    approvalProcess: APPROVAL_PROCESS_SPEC,
    queue: QUEUE_SPEC,
    group: GROUP_SPEC,
    role: ROLE_SPEC,
    messageChannel: LIGHTNING_MESSAGE_CHANNEL_SPEC,
    externalCredential: EXTERNAL_CREDENTIAL_SPEC,
    customNotificationType: CUSTOM_NOTIFICATION_TYPE_SPEC,
    reportType: REPORT_TYPE_SPEC,
} as const;

export type RecordMetadataType = keyof typeof RECORD_METADATA_SPECS;
