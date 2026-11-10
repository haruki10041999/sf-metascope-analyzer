import type { ApexUnitParseResult } from '../../parser/Apex/unit';
import type { LwcBundleParseResult } from '../../parser/Lwc/parser';
import type { MetadataFileParseResult } from '../../parser/Metadata/folder';
import type { ObjectParseResult } from '../../parser/Metadata/parser';
import type { ConvertKeys, ValueTree } from '../../types';
import { analyzeObject } from './analysis';
import { isCustomName, makeReferenceChecker, type MetadataFinding } from './references';

// 種類をまたぐ参照の取り出しと突き合わせ (優先度 B・C と、優先度 A の解析で確かめていない参照)。方針: docs/metadata-implementation.md 10 章
// - 参照は解析結果の JSON から取り出す (parse の順番には依らない。すべてを読んだあとに突き合わせる)
// - 参照先の種類の解析結果が 1 つもなければ、その種類は確かめない (リポジトリにないのか、読んでいないのか分からないため)
// - 名前空間付き (ns__Name) の名前・標準のもの (standard-Account など) は確かめない
// - 優先度 A の解析 (権限・Flow・画面・ラベル) が確かめる参照は、ここでは取り出さない (指摘が重ならないように)

/** 参照先の種類 */
export type ReferenceTargetType =
    | 'object'
    | 'field'
    | 'apexClass'
    | 'lwc'
    | 'aura'
    | 'flow'
    | 'flexiPage'
    | 'layout'
    | 'profile'
    | 'customTab'
    | 'customApplication'
    | 'customPermission'
    | 'customLabel'
    | 'quickAction'
    | 'emailTemplate'
    | 'report'
    | 'visualforcePage'
    | 'visualforceComponent'
    | 'staticResource'
    | 'globalValueSet'
    | 'role'
    | 'group'
    | 'queue'
    | 'externalCredential'
    | 'reportType'
    | 'messageChannel'
    | 'recordType'
    | 'matchingRule'
    | 'platformEventChannel'
    | 'apexTrigger';

/** 参照 1 つ */
export type MetadataReference = {
    /** 参照している単位の種類 (dataType) と id */
    fromType: string;
    from: string;
    refType: ReferenceTargetType;
    /** 参照先の名前 (object: Invoice__c / field: Invoice__c.Amount__c / emailTemplate: <フォルダ>/<名前> など) */
    target: string;
    /** どこで参照しているか (要素名・属性名など) */
    via: string;
    filePath: string;
    sourceKeys?: ConvertKeys;
};

export type ReferenceFinding = MetadataFinding<string> & {
    from: string;
    refType: ReferenceTargetType;
};

export type ReferenceAnalysis = {
    references: MetadataReference[];
    /** 参照先 (<refType>:<名前>) → 参照している単位の id (逆引き) */
    usedBy: Record<string, string[]>;
    findings: ReferenceFinding[];
};

/** 突き合わせの入力 */
export type ReferenceInputs = {
    /** フォルダ単位のメタデータの解析結果 (すべての種類をまとめて) */
    metadata?: MetadataFileParseResult[];
    objects?: ObjectParseResult[];
    apex?: ApexUnitParseResult[];
    lwc?: LwcBundleParseResult[];
};

type Json = Record<string, unknown> & { sourceKeys?: ConvertKeys };
type Ref = Omit<MetadataReference, 'fromType' | 'from' | 'filePath'>;

const str = (value: unknown): string | undefined =>
    typeof value === 'string' && value !== '' ? value : undefined;
const rows = (json: Json, name: string): Json[] => (json[name] as Json[] | undefined) ?? [];

/** 値の木から、name の要素の値 (文字列) をすべて集める */
const valuesInTree = (tree: unknown, name: string, found: string[] = []): string[] => {
    if (Array.isArray(tree)) tree.forEach((item) => valuesInTree(item, name, found));
    else if (typeof tree === 'object' && tree !== null) {
        Object.entries(tree as Record<string, ValueTree>).forEach(([key, value]) => {
            if (key === name && typeof value === 'string') found.push(value);
            else valuesInTree(value, name, found);
        });
    }
    return found;
};

/** c:name / c__name の部品名 (名前空間 c のもの)。ほかの名前空間は undefined */
const localComponent = (tag: string): string | undefined => {
    const match = tag.match(/^c(?::|__)(\w+)$/);
    return match ? match[1] : undefined;
};

const MERGE = /\{!([^}]*)\}/g;

/** 差し込みの中身から、ラベル・静的リソース・項目 (object.field) の参照を取り出す */
const expressionRefs = (
    expressions: string[],
    via: string,
    sourceKeys?: ConvertKeys,
    objectName?: string,
): Ref[] =>
    expressions.flatMap((expression): Ref[] => {
        const refs: Ref[] = [];
        for (const match of expression.matchAll(/\$Label\.(?:c\.)?(\w+)/g)) {
            refs.push({
                refType: 'customLabel',
                target: match[1]!,
                via,
                ...(sourceKeys ? { sourceKeys } : {}),
            });
        }
        for (const match of expression.matchAll(/\$Resource\.(\w+)/g)) {
            refs.push({
                refType: 'staticResource',
                target: match[1]!,
                via,
                ...(sourceKeys ? { sourceKeys } : {}),
            });
        }
        const field = expression.trim().match(/^(\w+)\.(\w+)$/);
        if (field && (!objectName || field[1] === objectName) && isCustomName(field[1]!)) {
            refs.push({
                refType: 'field',
                target: `${field[1]}.${field[2]}`,
                via,
                ...(sourceKeys ? { sourceKeys } : {}),
            });
        }
        return refs;
    });

const ref = (
    refType: ReferenceTargetType,
    target: string | undefined,
    via: string,
    node?: Json,
): Ref[] =>
    target
        ? [{ refType, target, via, ...(node?.sourceKeys ? { sourceKeys: node.sourceKeys } : {}) }]
        : [];

/** 共有先・キューのメンバー (role / roleAndSubordinates / group / queue) */
const principalRefs = (tree: unknown, via: string, node: Json): Ref[] => [
    ...valuesInTree(tree, 'role').flatMap((v) => ref('role', v, via, node)),
    ...valuesInTree(tree, 'roleAndSubordinates').flatMap((v) => ref('role', v, via, node)),
    ...valuesInTree(tree, 'roleAndSubordinatesInternal').flatMap((v) => ref('role', v, via, node)),
    ...valuesInTree(tree, 'group').flatMap((v) => ref('group', v, via, node)),
    ...valuesInTree(tree, 'publicGroup').flatMap((v) => ref('group', v, via, node)),
    ...valuesInTree(tree, 'queue').flatMap((v) => ref('queue', v, via, node)),
];

/** 条件の行 (criteriaItems) の field (<オブジェクト>.<項目>) */
const criteriaFieldRefs = (tree: unknown, via: string, node: Json, object?: string): Ref[] =>
    [...valuesInTree(tree, 'field'), ...valuesInTree(tree, 'column')].flatMap((field) => {
        const target = field.includes('.') ? field : object ? `${object}.${field}` : undefined;
        return ref('field', target, via, node);
    });

/** 種類 (dataType) ごとの参照の取り出し */
const EXTRACTORS: Record<string, (json: Json) => Ref[]> = {
    // ---- 優先度 A (A の解析で確かめていない参照だけ) ----
    permissionSet: (json) => permissionRefs(json),
    mutingPermissionSet: (json) => permissionRefs(json),
    profile: (json) => permissionRefs(json),
    layout: (json) => [
        ...rows(json, 'items').flatMap((item) =>
            ref('visualforcePage', str(item.page), 'items.page', item),
        ),
        ...((json.quickActions as string[] | undefined) ?? []).flatMap((name) =>
            ref('quickAction', name.includes('.') ? name : undefined, 'quickActions', json),
        ),
    ],
    // ---- 優先度 B ----
    customMetadata: (json) => {
        const type = `${String(json.fullName).split('.')[0]}__mdt`;
        return [
            ...ref('object', type, 'fullName', json),
            ...rows(json, 'values').flatMap((value) =>
                ref('field', `${type}.${String(value.field)}`, 'values.field', value),
            ),
        ];
    },
    customTab: (json) => [
        ...(json.customObject === true
            ? ref('object', str(json.fullName), 'customObject', json)
            : []),
        ...ref('lwc', str(json.lwcComponent), 'lwcComponent', json),
        ...ref('aura', str(json.auraComponent)?.replace(/^c:/, ''), 'auraComponent', json),
        ...ref('visualforcePage', str(json.page), 'page', json),
        ...ref('flexiPage', str(json.flexiPage), 'flexiPage', json),
    ],
    customApplication: (json) => [
        ...((json.tabs as string[] | undefined) ?? [])
            .filter((tab) => !tab.startsWith('standard-'))
            .flatMap((tab) => ref('customTab', tab, 'tabs', json)),
        ...ref('flexiPage', str(json.utilityBar), 'utilityBar', json),
        ...['actionOverrides', 'profileActionOverrides'].flatMap((element) =>
            rows(json, element).flatMap((override) => [
                ...ref(
                    'object',
                    str(override.pageOrSobjectType),
                    `${element}.pageOrSobjectType`,
                    override,
                ),
                ...overrideContentRefs(override, `${element}.content`),
                ...ref('profile', str(override.profile), `${element}.profile`, override),
            ]),
        ),
    ],
    customPermission: (json) =>
        rows(json, 'requiredPermission').flatMap((row) =>
            ref('customPermission', str(row.customPermission), 'requiredPermission', row),
        ),
    quickAction: (json) => {
        const name = String(json.fullName);
        const object =
            str(json.targetObject) ?? (name.includes('.') ? name.split('.')[0] : undefined);
        return [
            ...ref('object', object, 'targetObject', json),
            ...rows(json, 'fieldOverrides').flatMap((row) =>
                ref(
                    'field',
                    object ? `${object}.${String(row.field)}` : undefined,
                    'fieldOverrides.field',
                    row,
                ),
            ),
            ...valuesInTree(json.quickActionLayout, 'field').flatMap((field) =>
                ref('field', object ? `${object}.${field}` : undefined, 'quickActionLayout', json),
            ),
            ...ref(
                'lwc',
                str(json.lightningWebComponent)?.replace(/^c:/, ''),
                'lightningWebComponent',
                json,
            ),
            ...ref(
                'aura',
                str(json.lightningComponent)?.replace(/^c:/, ''),
                'lightningComponent',
                json,
            ),
            ...ref('flow', str(json.flowDefinition), 'flowDefinition', json),
            ...ref('visualforcePage', str(json.page), 'page', json),
        ];
    },
    sharingRules: (json) => {
        const object = String(json.fullName);
        return [
            ...ref('object', object, 'fullName', json),
            ...[
                'sharingCriteriaRules',
                'sharingOwnerRules',
                'sharingGuestRules',
                'sharingTerritoryRules',
            ].flatMap((element) =>
                rows(json, element).flatMap((rule) => [
                    ...criteriaFieldRefs(
                        rule.criteriaItems,
                        `${element}.criteriaItems`,
                        rule,
                        object,
                    ),
                    ...principalRefs(rule.sharedTo, `${element}.sharedTo`, rule),
                    ...principalRefs(rule.sharedFrom, `${element}.sharedFrom`, rule),
                ]),
            ),
        ];
    },
    apexPage: (json) => visualforceRefs(json),
    apexComponent: (json) => visualforceRefs(json),
    aura: (json) => {
        const attributes = (json.rootAttributes as Record<string, string> | undefined) ?? {};
        const declarations = (name: string) => rows(json, name);
        return [
            ...ref('apexClass', attributes.controller, 'controller', json),
            ...ref(
                'aura',
                attributes.extends ? localComponent(attributes.extends) : undefined,
                'extends',
                json,
            ),
            ...((json.components as string[] | undefined) ?? []).flatMap((tag) =>
                // c: の部品は LWC か Aura のどちらか (突き合わせのときにどちらかにあればよい)
                ref('lwc', localComponent(tag), 'components', json),
            ),
            ...declarations('registerEvents').flatMap((event) => {
                const type = (event.attributes as Record<string, string> | undefined)?.type;
                return ref(
                    'aura',
                    type ? localComponent(type) : undefined,
                    'registerEvents',
                    event,
                );
            }),
            // lightning:messageChannel の type は <名前>__c (定義の名前は __c なし)
            ...((json.messageChannels as string[] | undefined) ?? []).flatMap((type) =>
                ref('messageChannel', type.replace(/__c$/i, ''), 'messageChannels', json),
            ),
            ...expressionRefs(
                (json.expressions as string[] | undefined) ?? [],
                'expressions',
                json.sourceKeys,
            ),
        ];
    },
    // ---- 優先度 C ----
    emailTemplate: (json) => {
        const object = str(json.relatedEntityType);
        const text = `${String(json.subject ?? '')}\n${String(json.body ?? '')}`;
        const expressions = [...text.matchAll(MERGE)].map((m) => m[1]!);
        return [
            ...ref('object', object, 'relatedEntityType', json),
            ...expressionRefs(expressions, 'body', json.sourceKeys),
        ];
    },
    report: (json) => {
        const reportType = str(json.reportType);
        const object = reportType?.startsWith('CustomEntity$')
            ? reportType.slice('CustomEntity$'.length)
            : undefined;
        // カスタムレポートタイプは <名前>__c (定義の名前は __c なし)
        const custom = reportType?.match(/^(\w+?)__c$/)?.[1];
        return [
            ...ref('object', object, 'reportType', json),
            ...ref('reportType', custom, 'reportType', json),
            ...rows(json, 'columns').flatMap((column) => {
                const field = String(column.field);
                const [owner] = field.split('.');
                return field.includes('.') && isCustomName(owner!)
                    ? ref('field', field, 'columns', column)
                    : [];
            }),
        ];
    },
    reportType: (json) => [
        ...ref('object', str(json.baseObject), 'baseObject', json),
        // 列の table は基準のオブジェクトか、関係をたどったもの (Invoice__c.Lines__r)。関係の先のオブジェクトは
        // ここでは分からないので、table がオブジェクトの名前 (. なし) の列だけを項目の参照にする
        ...rows(json, 'sections').flatMap((section) =>
            ((section.columns as ValueTree[] | undefined) ?? []).flatMap((column) => {
                if (typeof column !== 'object' || column === null || Array.isArray(column))
                    return [];
                const { field, table } = column as Record<string, ValueTree>;
                return typeof field === 'string' &&
                    typeof table === 'string' &&
                    !field.includes('.') &&
                    !table.includes('.')
                    ? ref('field', `${table}.${field}`, 'sections.columns', section)
                    : [];
            }),
        ),
    ],
    dashboard: (json) =>
        ['leftSection', 'middleSection', 'rightSection', 'dashboardGridLayout'].flatMap((section) =>
            valuesInTree(json[section], 'report').flatMap((report) =>
                ref('report', report, `${section}.report`, json),
            ),
        ),
    translations: (json) => [
        ...rows(json, 'customLabels').flatMap((row) =>
            ref('customLabel', str(row.name), 'customLabels', row),
        ),
        ...rows(json, 'customTabs').flatMap((row) =>
            ref('customTab', str(row.name), 'customTabs', row),
        ),
        ...rows(json, 'customApplications').flatMap((row) =>
            ref('customApplication', str(row.name), 'customApplications', row),
        ),
        ...rows(json, 'quickActions').flatMap((row) =>
            ref('quickAction', str(row.name), 'quickActions', row),
        ),
        ...rows(json, 'flowDefinitions').flatMap((row) =>
            ref('flow', str(row.fullName), 'flowDefinitions', row),
        ),
    ],
    workflow: (json) => {
        const object = String(json.fullName);
        return [
            ...ref('object', object, 'fullName', json),
            ...rows(json, 'fieldUpdates').flatMap((row) =>
                ref(
                    'field',
                    row.field
                        ? `${str(row.targetObject) ?? object}.${String(row.field)}`
                        : undefined,
                    'fieldUpdates.field',
                    row,
                ),
            ),
            ...rows(json, 'alerts').flatMap((row) =>
                ref('emailTemplate', str(row.template), 'alerts.template', row),
            ),
            ...rows(json, 'rules').flatMap((row) =>
                criteriaFieldRefs(row.criteriaItems, 'rules.criteriaItems', row, object),
            ),
        ];
    },
    approvalProcess: (json) => {
        const object = String(json.fullName).split('.')[0];
        return [
            ...ref('object', object, 'fullName', json),
            ...ref('emailTemplate', str(json.emailTemplate), 'emailTemplate', json),
            ...criteriaFieldRefs(json.entryCriteria, 'entryCriteria', json, object),
            ...rows(json, 'approvalStep').flatMap((step) => [
                ...criteriaFieldRefs(
                    step.entryCriteria,
                    'approvalStep.entryCriteria',
                    step,
                    object,
                ),
                ...approverRefs(step.assignedApprover, step),
            ]),
        ];
    },
    queue: (json) => [
        ...rows(json, 'queueSobject').flatMap((row) =>
            ref('object', str(row.sobjectType), 'queueSobject', row),
        ),
        ...principalRefs(json.queueMembers, 'queueMembers', json),
    ],
    role: (json) => ref('role', str(json.parentRole), 'parentRole', json),
    namedCredential: (json) =>
        rows(json, 'namedCredentialParameters').flatMap((row) =>
            ref(
                'externalCredential',
                str(row.externalCredential),
                'namedCredentialParameters.externalCredential',
                row,
            ),
        ),
    // ---- 単位がなかった種類 (docs/json-gaps.md 3 章) ----
    assignmentRules: (json) => caseRuleRefs(json, 'assignmentRule'),
    autoResponseRules: (json) => caseRuleRefs(json, 'autoResponseRule'),
    escalationRules: (json) => caseRuleRefs(json, 'escalationRule'),
    pathAssistant: (json) => {
        const object = str(json.entityName);
        const field = str(json.fieldName);
        const recordType = str(json.recordTypeName);
        return [
            ...ref('object', object, 'entityName', json),
            ...ref('field', object && field ? `${object}.${field}` : undefined, 'fieldName', json),
            // __MASTER__ はレコードタイプなし
            ...ref(
                'recordType',
                object && recordType && recordType !== '__MASTER__'
                    ? `${object}.${recordType}`
                    : undefined,
                'recordTypeName',
                json,
            ),
            ...rows(json, 'pathAssistantSteps').flatMap((step) =>
                ((step.fieldNames as string[] | undefined) ?? []).flatMap((name) =>
                    ref(
                        'field',
                        object ? `${object}.${name}` : undefined,
                        'pathAssistantSteps.fieldNames',
                        step,
                    ),
                ),
            ),
        ];
    },
    duplicateRule: (json) => [
        ...ref('object', String(json.fullName).split('.')[0], 'fullName', json),
        // 一致ルールは <オブジェクト>.<名前> (一致ルールの単位の子)
        ...rows(json, 'duplicateRuleMatchRules').flatMap((row) => {
            const object = str(row.matchRuleSObjectType);
            const rule = str(row.matchingRule);
            return [
                ...ref('object', object, 'duplicateRuleMatchRules.matchRuleSObjectType', row),
                ...ref(
                    'matchingRule',
                    object && rule ? `${object}.${rule}` : undefined,
                    'duplicateRuleMatchRules.matchingRule',
                    row,
                ),
            ];
        }),
    ],
    matchingRules: (json) => {
        const object = String(json.fullName);
        return [
            ...ref('object', object, 'fullName', json),
            ...rows(json, 'matchingRules').flatMap((rule) =>
                valuesInTree(rule.matchingRuleItems, 'fieldName').flatMap((field) =>
                    ref('field', `${object}.${field}`, 'matchingRules.matchingRuleItems', rule),
                ),
            ),
        ];
    },
    platformEventChannelMember: (json) => [
        ...ref('platformEventChannel', str(json.eventChannel), 'eventChannel', json),
        ...ref('object', eventEntityObject(str(json.selectedEntity)), 'selectedEntity', json),
    ],
    platformEventSubscriberConfig: (json) =>
        ref('apexTrigger', str(json.platformEventConsumer), 'platformEventConsumer', json),
};

/**
 * 割り当て・自動応答・エスカレーションのルール (<オブジェクト>.<種類>Rules)。
 * ルールの行 (ruleEntry) の条件の項目、割り当て先のキュー (assignedToType が Queue)、メールテンプレート
 */
function caseRuleRefs(json: Json, element: string): Ref[] {
    const object = String(json.fullName);
    return [
        ...ref('object', object, 'fullName', json),
        ...rows(json, element).flatMap((rule) => {
            const via = `${element}.ruleEntry`;
            const queues: string[] = [];
            const visit = (value: unknown) => {
                if (Array.isArray(value)) value.forEach(visit);
                else if (typeof value === 'object' && value !== null) {
                    const record = value as Record<string, unknown>;
                    const assignedTo = str(record.assignedTo);
                    if (assignedTo && str(record.assignedToType)?.toLowerCase() === 'queue')
                        queues.push(assignedTo);
                    Object.values(record).forEach(visit);
                }
            };
            visit(rule.ruleEntry);
            return [
                ...criteriaFieldRefs(rule.ruleEntry, via, rule, object),
                ...queues.flatMap((queue) => ref('queue', queue, via, rule)),
                ...['template', 'assignedToTemplate', 'notifyToTemplate'].flatMap((name) =>
                    valuesInTree(rule.ruleEntry, name).flatMap((template) =>
                        ref('emailTemplate', template, via, rule),
                    ),
                ),
            ];
        }),
    ];
}

/** チャネルのメンバーの selectedEntity のオブジェクト (AccountChangeEvent → Account、Invoice__ChangeEvent → Invoice__c) */
function eventEntityObject(entity: string | undefined): string | undefined {
    if (!entity) return undefined;
    if (/__ChangeEvent$/.test(entity)) return entity.replace(/__ChangeEvent$/, '__c');
    if (/ChangeEvent$/.test(entity)) return entity.replace(/ChangeEvent$/, '');
    return entity;
}

/** 権限セット・Profile のうち、A の解析で確かめていない参照 (カスタム権限・タブ・アプリ・Visualforce ページ) */
function permissionRefs(json: Json): Ref[] {
    return [
        ...rows(json, 'customPermissions').flatMap((row) =>
            ref('customPermission', str(row.name), 'customPermissions', row),
        ),
        ...[...rows(json, 'tabSettings'), ...rows(json, 'tabVisibilities')]
            .filter((row) => !String(row.tab).startsWith('standard-'))
            .flatMap((row) => ref('customTab', str(row.tab), 'tabSettings', row)),
        ...rows(json, 'applicationVisibilities').flatMap((row) =>
            ref('customApplication', str(row.application), 'applicationVisibilities', row),
        ),
        ...rows(json, 'pageAccesses').flatMap((row) =>
            ref('visualforcePage', str(row.apexPage), 'pageAccesses', row),
        ),
    ];
}

/** アクションの上書きの content (type で種類が決まる) */
function overrideContentRefs(override: Json, via: string): Ref[] {
    const content = str(override.content);
    switch (String(override.type).toLowerCase()) {
        case 'flexipage':
            return ref('flexiPage', content, via, override);
        case 'visualforce':
            return ref('visualforcePage', content, via, override);
        case 'lightningcomponent':
            return ref('aura', content?.replace(/^c:/, ''), via, override);
        default:
            return [];
    }
}

/** Visualforce: コントローラー・拡張 (Apex)、標準コントローラー (オブジェクト)、c: の部品、差し込み */
function visualforceRefs(json: Json): Ref[] {
    const markup = json.markup as Json | undefined;
    if (!markup) return [];
    const attributes = (markup.attributes as Record<string, string> | undefined) ?? {};
    const standardController = attributes.standardController;
    return [
        ...ref('apexClass', attributes.controller, 'markup.controller', markup),
        ...(attributes.extensions ?? '')
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean)
            .flatMap((name) => ref('apexClass', name, 'markup.extensions', markup)),
        ...ref('object', standardController, 'markup.standardController', markup),
        ...((markup.components as string[] | undefined) ?? []).flatMap((tag) =>
            ref('visualforceComponent', localComponent(tag), 'markup.components', markup),
        ),
        ...expressionRefs(
            (markup.expressions as string[] | undefined) ?? [],
            'markup.expressions',
            markup.sourceKeys,
            standardController,
        ),
    ];
}

/** 承認者 (approver の type が queue / role / roleSubordinates) */
function approverRefs(tree: unknown, node: Json): Ref[] {
    const found: Ref[] = [];
    const visit = (value: unknown) => {
        if (Array.isArray(value)) value.forEach(visit);
        else if (typeof value === 'object' && value !== null) {
            const record = value as Record<string, unknown>;
            const name = str(record.name);
            const type = str(record.type);
            if (name && type === 'queue')
                found.push(...ref('queue', name, 'approvalStep.assignedApprover', node));
            if (name && (type === 'role' || type === 'roleSubordinates')) {
                found.push(...ref('role', name, 'approvalStep.assignedApprover', node));
            }
            Object.values(record).forEach(visit);
        }
    };
    visit(tree);
    return found;
}

/** dataType → 参照先の種類 (その種類の名前の一覧を作るため) */
const TARGET_OF_DATA_TYPE: Partial<Record<string, ReferenceTargetType>> = {
    flow: 'flow',
    flexiPage: 'flexiPage',
    layout: 'layout',
    profile: 'profile',
    customTab: 'customTab',
    customApplication: 'customApplication',
    customPermission: 'customPermission',
    quickAction: 'quickAction',
    emailTemplate: 'emailTemplate',
    report: 'report',
    apexPage: 'visualforcePage',
    apexComponent: 'visualforceComponent',
    staticResource: 'staticResource',
    globalValueSet: 'globalValueSet',
    role: 'role',
    group: 'group',
    queue: 'queue',
    aura: 'aura',
    externalCredential: 'externalCredential',
    reportType: 'reportType',
    messageChannel: 'messageChannel',
    platformEventChannel: 'platformEventChannel',
};

/** 名前空間付きの名前 (ns__Name。カスタムの接尾辞 __c などは除く) */
const isNamespaced = (name: string) => /^[A-Za-z][A-Za-z0-9]*__[A-Za-z]/.test(name);

const toCode = (refType: string) =>
    `UNKNOWN_${refType.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}`;

/** 種類をまたぐ参照の取り出しと突き合わせ */
/** フォルダ単位のメタデータの単位 1 つの参照 (依存関係のグラフも使う) */
export const extractMetadataReferences = (result: MetadataFileParseResult): MetadataReference[] => {
    if (result.dataType === 'error') return [];
    const extract = EXTRACTORS[result.dataType];
    if (!extract) return [];
    return extract(result.result.base as Json).map((r) => ({
        fromType: result.dataType,
        from: result.result.id,
        filePath: result.filePath,
        ...r,
    }));
};

export const analyzeMetadataReferences = (inputs: ReferenceInputs): ReferenceAnalysis => {
    const metadata = (inputs.metadata ?? []).filter((r) => r.dataType !== 'error');
    const references: MetadataReference[] = metadata.flatMap(extractMetadataReferences);
    // オブジェクトの項目が使うグローバル値セット
    for (const object of inputs.objects ?? []) {
        if (object.dataType !== 'object') continue;
        for (const field of object.result.base.fields ?? []) {
            if (field.kind !== 'field' || !field.valueSet?.valueSetName) continue;
            references.push({
                fromType: 'object',
                from: object.result.id,
                filePath: object.filePath,
                refType: 'globalValueSet',
                target: field.valueSet.valueSetName,
                via: `fields.${field.apiName}.valueSet`,
                sourceKeys: field.sourceKeys,
            });
        }
    }

    // 参照先の名前の一覧 (解析結果が 1 つもない種類は持たない = 確かめない)
    const known = new Map<ReferenceTargetType, Set<string>>();
    const add = (type: ReferenceTargetType, name: string) => {
        const set = known.get(type) ?? new Set<string>();
        set.add(name.toLowerCase());
        known.set(type, set);
    };
    for (const result of inputs.metadata ?? []) {
        const type = TARGET_OF_DATA_TYPE[result.dataType];
        if (!type) continue;
        // 名前は JSON の fullName (優先度 B・C) か name (優先度 A・Aura)。入れ子のフォルダは <フォルダ>/<名前>
        const base = result.result.base as Json;
        add(type, String(base.fullName ?? base.name));
    }
    for (const result of inputs.metadata ?? []) {
        if (result.dataType !== 'customLabels') continue;
        ((result.result.base as Json).labels as Json[] | undefined)?.forEach((label) =>
            add('customLabel', String(label.fullName)),
        );
    }
    inputs.apex?.forEach(
        (unit) => unit.result.base.unitType === 'class' && add('apexClass', unit.result.base.name),
    );
    inputs.lwc?.forEach(
        (bundle) => bundle.dataType === 'lwcBundle' && add('lwc', bundle.result.base.name),
    );

    const check = makeReferenceChecker(
        inputs.objects
            ? {
                  objects: inputs.objects.flatMap((r) =>
                      r.dataType === 'object' ? [analyzeObject(r.result.base)] : [],
                  ),
              }
            : {},
    );
    const findings: ReferenceFinding[] = [];
    const seen = new Set<string>();
    for (const reference of references) {
        const { refType, target } = reference;
        let problem: { code: string; message: string } | undefined;
        if (refType === 'object') problem = check.object(target);
        else if (refType === 'field') problem = check.field(target);
        else if (!isNamespaced(target)) {
            const names = known.get(refType);
            const lwcOrAura =
                refType === 'lwc' && reference.fromType === 'aura'
                    ? (known.get('aura')?.has(target.toLowerCase()) ?? false)
                    : false;
            if (names && !names.has(target.toLowerCase()) && !lwcOrAura) {
                problem = {
                    code: toCode(refType),
                    message: `${refType} ${target} がリポジトリにない`,
                };
            }
        }
        if (!problem) continue;
        const key = `${reference.from}:${problem.code}:${target}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
            code: problem.code,
            severity: 'warning',
            from: reference.from,
            refType,
            target,
            message: problem.message,
            filePath: reference.filePath,
            ...(reference.sourceKeys ? { sourceKeys: reference.sourceKeys } : {}),
        });
    }

    const usedBy: Record<string, string[]> = {};
    references.forEach((r) => {
        const key = `${r.refType}:${r.target}`;
        usedBy[key] = [...new Set([...(usedBy[key] ?? []), r.from])];
    });

    return { references, usedBy, findings };
};
