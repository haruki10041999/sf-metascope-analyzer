import type { ConvertKeys, FormulaValue, FxJson, ValueTree } from '../../types';
import { formulaNameOf } from '../../types/metadata/criteria';
import { type FormulaReference, formulaReferencesOf } from '../dependency/formula';
import type { DependencyKind, DependencyTargetType } from '../dependency/types';

import { FLOW_START, type FlowJson } from '../../types';

import { analyzeFlowRefs } from './flowRefs';
import { markupTagsOf, mergeTextsOf } from './markup';
import { isCustomName } from './references';
import {
    initialMetadataWalkContext,
    isFormulaNode,
    type MetadataWalkContext,
    metadataRecordsOf,
    metadataValuesOf,
    walkMetadataJson,
} from './walker';

// フォルダ単位のメタデータの参照の取り出し (docs/json-redesign-plan.md の段階 M2、docs/metadata-json-review.md 7.1 の #1・#3)。
// 今まで 4 か所 (referenceAnalysis.ts の EXTRACTORS、units.ts の A_TYPE_REFERENCES・permissionReferences・
// embeddedFormulaReferences、Flow の references) にあったものを、種類ごとの表 1 つにまとめた。
// - 参照の種類の名前は、依存関係の定義の種類 (DependencyTargetType) と同じ 1 つの語彙にする
//   (Visualforce のページは apexPage、Aura は aura、ラベルは customLabel、グローバル変数は globalVariable)
// - 同じ場所 (メンバー・文・式) の同じ参照先は 1 つにする。kind は uses より細かいもの (grants / reads など) を残す
//   (権限の pageAccesses・Flow の数式の {!$Record.X} が 2 本の辺になっていた)
// - 値の木は共通の走査 (walker.ts) でたどる

type Json = Record<string, unknown> & { sourceKeys?: ConvertKeys };

/** 参照 1 つ (解析の結果。LWC の LwcCallInfo と同じく kind を持たず、場所の sourceKeys を持つ) */
export type MetadataRefInfo = {
    refType: DependencyTargetType;
    /** 参照先の名前 (object: Invoice__c / field: Invoice__c.Amount__c / emailTemplate: <フォルダ>/<名前> など) */
    target: string;
    /** 参照の意味 (uses / grants / reads / places など) */
    kind: DependencyKind;
    /** どこで参照しているか (要素名・属性名など) */
    via: string;
    /** 単位の中のメンバー (<単位の名前>.<要素の名前>)。単位の直下なら持たない */
    member?: string;
    /** 文 (参照を持つ行・要素) */
    statement?: ConvertKeys;
    /** 式 (参照そのもの。行の値なら行) */
    expression?: ConvertKeys;
};

/** 種類ごとの取り出しに渡すもの */
type RefSource = { json: Json; name: string; dataType: string };

const isRecord = (value: unknown): value is Json =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
const str = (value: unknown): string | undefined =>
    typeof value === 'string' && value !== '' ? value : undefined;
const rows = (json: Json, name: string): Json[] =>
    Array.isArray(json[name]) ? (json[name] as unknown[]).filter(isRecord) : [];
const strings = (json: Json, name: string): string[] =>
    Array.isArray(json[name])
        ? (json[name] as unknown[]).filter((v): v is string => typeof v === 'string')
        : [];

/** 行・ノードの参照 (文と式はそのノード) */
const ref = (
    refType: DependencyTargetType,
    target: string | undefined,
    via: string,
    node?: Json,
    kind: DependencyKind = 'uses',
): MetadataRefInfo[] =>
    target
        ? [
              {
                  refType,
                  target,
                  kind,
                  via,
                  ...(node?.sourceKeys
                      ? { statement: node.sourceKeys, expression: node.sourceKeys }
                      : {}),
              },
          ]
        : [];

/** 行の値の参照 (権限の行など)。via は <行>.<プロパティ> */
const rowRefs = (
    json: Json,
    rowName: string,
    property: string,
    refType: DependencyTargetType,
    kind: DependencyKind,
    toTarget: (value: string) => string | undefined = (value) => value,
): MetadataRefInfo[] =>
    rows(json, rowName).flatMap((row) => {
        const value = str(row[property]);
        return ref(
            refType,
            value ? toTarget(value) : undefined,
            `${rowName}.${property}`,
            row,
            kind,
        );
    });

/** c:name / c__name の部品名 (名前空間 c のもの)。ほかの名前空間は undefined */
const localComponent = (tag: string): string | undefined => tag.match(/^c(?::|__)(\w+)$/)?.[1];

/** 宣言 (aura:attribute など) の属性の値 (差し込みを探すため) */
const declarationTexts = (declarations: unknown): string[] =>
    (Array.isArray(declarations) ? declarations : []).flatMap((declaration) =>
        isRecord(declaration) && isRecord(declaration.attributes)
            ? Object.values(declaration.attributes).filter(
                  (v): v is string => typeof v === 'string',
              )
            : [],
    );

/** 差し込みの中身から、ラベル・静的リソース・項目 (object.field) の参照を取り出す */
const expressionRefs = (
    expressions: string[],
    via: string,
    node: Json,
    objectName?: string,
): MetadataRefInfo[] =>
    expressions.flatMap((expression) => [
        ...[...expression.matchAll(/\$Label\.(?:c\.)?(\w+)/g)].flatMap((m) =>
            ref('customLabel', m[1], via, node),
        ),
        ...[...expression.matchAll(/\$Resource\.(\w+)/g)].flatMap((m) =>
            ref('staticResource', m[1], via, node),
        ),
        ...(() => {
            const field = expression.trim().match(/^(\w+)\.(\w+)$/);
            return field && (!objectName || field[1] === objectName) && isCustomName(field[1]!)
                ? ref('field', `${field[1]}.${field[2]}`, via, node)
                : [];
        })(),
    ]);

/** 共有先・キューのメンバー (role / roleAndSubordinates / group / queue) */
const principalRefs = (tree: unknown, via: string, node: Json): MetadataRefInfo[] => [
    ...metadataValuesOf(tree, 'role').flatMap((v) => ref('role', v, via, node)),
    ...metadataValuesOf(tree, 'roleAndSubordinates').flatMap((v) => ref('role', v, via, node)),
    ...metadataValuesOf(tree, 'roleAndSubordinatesInternal').flatMap((v) =>
        ref('role', v, via, node),
    ),
    ...metadataValuesOf(tree, 'group').flatMap((v) => ref('group', v, via, node)),
    ...metadataValuesOf(tree, 'publicGroup').flatMap((v) => ref('group', v, via, node)),
    ...metadataValuesOf(tree, 'queue').flatMap((v) => ref('queue', v, via, node)),
];

const isString = (value: string | undefined): value is string => value !== undefined;

/**
 * 条件の行 (criteriaItems) の field (<オブジェクト>.<項目>)。
 * criterion (段階 M5) は左辺の項目、値の木 (承認・割り当てのルールなど) は field・column の値
 */
const criteriaFieldRefs = (
    tree: unknown,
    via: string,
    node: Json,
    object?: string,
): MetadataRefInfo[] =>
    [
        ...metadataRecordsOf(tree).flatMap((record) =>
            record.kind === 'criterion' ? [formulaNameOf(record.left)].filter(isString) : [],
        ),
        ...metadataValuesOf(tree, 'field'),
        ...metadataValuesOf(tree, 'column'),
    ].flatMap((field) =>
        ref(
            'field',
            field.includes('.') ? field : object ? `${object}.${field}` : undefined,
            via,
            node,
        ),
    );

// ---------------------------------------------------------------------------
// 種類ごとの参照
// ---------------------------------------------------------------------------

/** 権限 (権限セット・ミュート権限セット・プロファイル) が与えるもの・使うもの */
const permissionRefs = ({ json }: RefSource): MetadataRefInfo[] => [
    ...rowRefs(json, 'objectPermissions', 'object', 'object', 'grants'),
    ...rowRefs(json, 'fieldPermissions', 'field', 'field', 'grants'),
    ...rowRefs(json, 'classAccesses', 'apexClass', 'apexClass', 'grants'),
    ...rowRefs(json, 'pageAccesses', 'apexPage', 'apexPage', 'grants'),
    ...rowRefs(json, 'recordTypeVisibilities', 'recordType', 'recordType', 'grants'),
    ...rowRefs(json, 'layoutAssignments', 'layout', 'layout', 'uses'),
    ...rowRefs(json, 'loginFlows', 'flow', 'flow', 'uses'),
    // カスタム設定・カスタムメタデータ型はオブジェクト (X__c / X__mdt)
    ...rowRefs(json, 'customSettingAccesses', 'name', 'object', 'grants'),
    ...rowRefs(json, 'customMetadataTypeAccesses', 'name', 'object', 'grants'),
    ...rowRefs(json, 'flowAccesses', 'flow', 'flow', 'grants'),
    // プリンシパルは <外部ログイン情報>-<プリンシパル名> (API 名は - を含まないので、最初の - の前が外部ログイン情報)
    ...rowRefs(
        json,
        'externalCredentialPrincipalAccesses',
        'externalCredentialPrincipal',
        'externalCredential',
        'grants',
        (principal) => principal.split('-')[0]!,
    ),
    ...rowRefs(
        json,
        'externalDataSourceAccesses',
        'externalDataSource',
        'externalDataSource',
        'grants',
    ),
    ...rowRefs(json, 'customPermissions', 'name', 'customPermission', 'grants'),
    // 標準のタブ (standard-Account) は参照にしない
    ...[...rows(json, 'tabSettings'), ...rows(json, 'tabVisibilities')].flatMap((row) => {
        const tab = str(row.tab);
        return ref(
            'customTab',
            tab?.startsWith('standard-') ? undefined : tab,
            'tabSettings',
            row,
            'grants',
        );
    }),
    ...rowRefs(json, 'applicationVisibilities', 'application', 'customApplication', 'grants'),
];

/** アクションの上書きの content (type で種類が決まる) */
const overrideContentRefs = (override: Json, via: string): MetadataRefInfo[] => {
    const content = str(override.content);
    switch (String(override.type).toLowerCase()) {
        case 'flexipage':
            return ref('flexiPage', content, via, override);
        case 'visualforce':
            return ref('apexPage', content, via, override);
        case 'lightningcomponent':
            return ref('aura', content?.replace(/^c:/, ''), via, override);
        default:
            return [];
    }
};

/** Visualforce: コントローラー・拡張 (Apex)、標準コントローラー (オブジェクト)、c: の部品、差し込み */
const visualforceRefs = ({ json }: RefSource): MetadataRefInfo[] => {
    const markup = isRecord(json.markup) ? json.markup : undefined;
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
        // 使っている部品・差し込みは本体の木から出す (段階 M6。via は以前の JSON のプロパティ名のまま)
        ...markupTagsOf(markup.body).flatMap((tag) =>
            ref('apexComponent', localComponent(tag), 'markup.components', markup),
        ),
        ...expressionRefs(
            mergeTextsOf(markup.body, [
                ...Object.values(attributes),
                ...declarationTexts(markup.componentAttributes),
            ]),
            'markup.expressions',
            markup,
            standardController,
        ),
    ];
};

/**
 * 割り当て・自動応答・エスカレーションのルール (<オブジェクト>.<種類>Rules)。
 * ルールの行 (ruleEntry) の条件の項目、割り当て先のキュー (assignedToType が Queue)、メールテンプレート
 */
const caseRuleRefs =
    (element: string) =>
    ({ json, name }: RefSource): MetadataRefInfo[] => [
        ...ref('object', name, 'fullName', json),
        ...rows(json, element).flatMap((rule) => {
            const via = `${element}.ruleEntry`;
            const queues = metadataRecordsOf(rule.ruleEntry).flatMap((record) => {
                const assignedTo = str(record.assignedTo);
                return assignedTo && str(record.assignedToType)?.toLowerCase() === 'queue'
                    ? [assignedTo]
                    : [];
            });
            return [
                ...criteriaFieldRefs(rule.ruleEntry, via, rule, name),
                ...queues.flatMap((queue) => ref('queue', queue, via, rule)),
                ...['template', 'assignedToTemplate', 'notifyToTemplate'].flatMap((property) =>
                    metadataValuesOf(rule.ruleEntry, property).flatMap((template) =>
                        ref('emailTemplate', template, via, rule),
                    ),
                ),
            ];
        }),
    ];

/** 承認者 (approver の type が queue / role / roleSubordinates) */
const approverRefs = (tree: unknown, node: Json): MetadataRefInfo[] =>
    metadataRecordsOf(tree).flatMap((record) => {
        const name = str(record.name);
        const type = str(record.type);
        if (!name) return [];
        if (type === 'queue') return ref('queue', name, 'approvalStep.assignedApprover', node);
        if (type === 'role' || type === 'roleSubordinates') {
            return ref('role', name, 'approvalStep.assignedApprover', node);
        }
        return [];
    });

/** チャネルのメンバーの selectedEntity のオブジェクト (AccountChangeEvent → Account、Invoice__ChangeEvent → Invoice__c) */
const eventEntityObject = (entity: string | undefined): string | undefined => {
    if (!entity) return undefined;
    if (/__ChangeEvent$/.test(entity)) return entity.replace(/__ChangeEvent$/, '__c');
    if (/ChangeEvent$/.test(entity)) return entity.replace(/ChangeEvent$/, '');
    return entity;
};

/**
 * Flow の要素・資源・起動が使っているもの (Metadata/flowRefs.ts の解析。段階 M3 で JSON の references から移した)。
 * 同じ Flow の要素・資源 (element) は、Flow の中の参照なので依存関係にしない。起動はメンバーを持たない (単位の直下)
 */
const flowRefs = ({ json, name }: RefSource): MetadataRefInfo[] =>
    analyzeFlowRefs(json as unknown as FlowJson).flatMap((r): MetadataRefInfo[] =>
        r.refType === 'element'
            ? []
            : [
                  {
                      refType: r.refType,
                      target: r.target,
                      kind: 'uses',
                      via: `flow.${r.elementKind}`,
                      ...(r.element !== FLOW_START ? { member: `${name}.${r.element}` } : {}),
                      ...(r.sourceKeys ? { statement: r.sourceKeys } : {}),
                  },
              ],
    );

/** 種類 (dataType) ごとの参照の取り出し */
const EXTRACTORS: Record<string, (source: RefSource) => MetadataRefInfo[]> = {
    permissionSet: permissionRefs,
    mutingPermissionSet: permissionRefs,
    profile: permissionRefs,
    permissionSetGroup: ({ json }) => {
        const statement = json.sourceKeys ? { statement: json.sourceKeys } : {};
        return [
            ...strings(json, 'permissionSets').map((target): MetadataRefInfo => ({
                refType: 'permissionSet',
                target,
                kind: 'uses',
                via: 'permissionSets',
                ...statement,
            })),
            ...strings(json, 'mutingPermissionSets').map((target): MetadataRefInfo => ({
                refType: 'mutingPermissionSet',
                target,
                kind: 'uses',
                via: 'mutingPermissionSets',
                ...statement,
            })),
        ];
    },
    layout: ({ json }) => {
        const object = str(json.objectApiName);
        return [
            ...rowRefs(json, 'items', 'field', 'field', 'places', (field) =>
                object ? `${object}.${field}` : undefined,
            ).map((r) => ({ ...r, via: 'items.field' })),
            ...rows(json, 'items').flatMap((item) =>
                ref('apexPage', str(item.page), 'items.page', item),
            ),
            ...strings(json, 'quickActions').flatMap((name) =>
                ref('quickAction', name.includes('.') ? name : undefined, 'quickActions', json),
            ),
        ];
    },
    flexiPage: ({ json }) => {
        const object = str(json.sobjectType);
        return [
            ...(object
                ? [
                      {
                          refType: 'object',
                          target: object,
                          kind: 'uses',
                          via: 'sobjectType',
                      } as MetadataRefInfo,
                  ]
                : []),
            ...(object
                ? rowRefs(
                      json,
                      'fields',
                      'fieldItem',
                      'field',
                      'places',
                      (item) => `${object}.${item.replace(/^Record\./, '')}`,
                  )
                : []),
            // c:<名前> (自分の名前空間の LWC / Aura)
            ...rows(json, 'components').flatMap((component) =>
                ref(
                    'lwc',
                    str(component.componentName)?.match(/^c:(\w+)$/)?.[1],
                    'components',
                    component,
                    'places',
                ),
            ),
        ];
    },
    flow: flowRefs,
    customMetadata: ({ json }) => {
        const type = `${String(json.fullName).split('.')[0]}__mdt`;
        return [
            ...ref('object', type, 'fullName', json),
            ...rows(json, 'values').flatMap((value) =>
                ref('field', `${type}.${String(value.field)}`, 'values.field', value),
            ),
        ];
    },
    customTab: ({ json }) => [
        ...(json.customObject === true
            ? ref('object', str(json.fullName), 'customObject', json)
            : []),
        ...ref('lwc', str(json.lwcComponent), 'lwcComponent', json),
        ...ref('aura', str(json.auraComponent)?.replace(/^c:/, ''), 'auraComponent', json),
        ...ref('apexPage', str(json.page), 'page', json),
        ...ref('flexiPage', str(json.flexiPage), 'flexiPage', json),
    ],
    customApplication: ({ json }) => [
        ...strings(json, 'tabs')
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
    customPermission: ({ json }) =>
        rows(json, 'requiredPermission').flatMap((row) =>
            ref('customPermission', str(row.customPermission), 'requiredPermission', row),
        ),
    quickAction: ({ json }) => {
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
            ...metadataValuesOf(json.quickActionLayout, 'field').flatMap((field) =>
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
            ...ref('apexPage', str(json.page), 'page', json),
        ];
    },
    sharingRules: ({ json, name }) => [
        ...ref('object', name, 'fullName', json),
        ...[
            'sharingCriteriaRules',
            'sharingOwnerRules',
            'sharingGuestRules',
            'sharingTerritoryRules',
        ].flatMap((element) =>
            rows(json, element).flatMap((rule) => [
                ...criteriaFieldRefs(rule.criteriaItems, `${element}.criteriaItems`, rule, name),
                ...principalRefs(rule.sharedTo, `${element}.sharedTo`, rule),
                ...principalRefs(rule.sharedFrom, `${element}.sharedFrom`, rule),
            ]),
        ),
    ],
    apexPage: visualforceRefs,
    apexComponent: visualforceRefs,
    aura: ({ json }) => {
        const attributes = (json.rootAttributes as Record<string, string> | undefined) ?? {};
        return [
            ...ref('apexClass', attributes.controller, 'controller', json),
            ...ref(
                'aura',
                attributes.extends ? localComponent(attributes.extends) : undefined,
                'extends',
                json,
            ),
            // c: の部品は LWC か Aura のどちらか (グラフで、どちらかにあればよい)
            ...markupTagsOf(json.body).flatMap((tag) =>
                ref('lwc', localComponent(tag), 'components', json),
            ),
            ...rows(json, 'registerEvents').flatMap((event) => {
                const type = (event.attributes as Record<string, string> | undefined)?.type;
                return ref(
                    'aura',
                    type ? localComponent(type) : undefined,
                    'registerEvents',
                    event,
                );
            }),
            // lightning:messageChannel の type は <名前>__c (定義の名前は __c なし)
            ...strings(json, 'messageChannels').flatMap((type) =>
                ref('messageChannel', type.replace(/__c$/i, ''), 'messageChannels', json),
            ),
            ...expressionRefs(
                mergeTextsOf(json.body, [
                    ...Object.values(attributes),
                    ...['attributes', 'registerEvents', 'handlers', 'methods'].flatMap((key) =>
                        declarationTexts(json[key]),
                    ),
                ]),
                'expressions',
                json,
            ),
        ];
    },
    emailTemplate: ({ json }) => [
        ...ref('object', str(json.relatedEntityType), 'relatedEntityType', json),
        // 件名・本文のテンプレート (段階 M6) の差し込み。差し込みのない値は文字列のまま
        ...expressionRefs(
            mergeTextsOf(
                [json.subject, json.body],
                [json.subject, json.body].filter((v): v is string => typeof v === 'string'),
            ),
            'body',
            json,
        ),
    ],
    report: ({ json }) => {
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
    reportType: ({ json }) => [
        ...ref('object', str(json.baseObject), 'baseObject', json),
        // 列の table は基準のオブジェクトか、関係をたどったもの (Invoice__c.Lines__r)。関係の先のオブジェクトは
        // ここでは分からないので、table がオブジェクトの名前 (. なし) の列だけを項目の参照にする
        ...rows(json, 'sections').flatMap((section) =>
            ((section.columns as ValueTree[] | undefined) ?? []).flatMap((column) => {
                if (!isRecord(column)) return [];
                const { field, table } = column;
                return typeof field === 'string' &&
                    typeof table === 'string' &&
                    !field.includes('.') &&
                    !table.includes('.')
                    ? ref('field', `${table}.${field}`, 'sections.columns', section)
                    : [];
            }),
        ),
    ],
    dashboard: ({ json }) =>
        ['leftSection', 'middleSection', 'rightSection', 'dashboardGridLayout'].flatMap((section) =>
            metadataValuesOf(json[section], 'report').flatMap((report) =>
                ref('report', report, `${section}.report`, json),
            ),
        ),
    translations: ({ json }) => [
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
    workflow: ({ json, name }) => [
        ...ref('object', name, 'fullName', json),
        ...rows(json, 'fieldUpdates').flatMap((row) =>
            ref(
                'field',
                row.field ? `${str(row.targetObject) ?? name}.${String(row.field)}` : undefined,
                'fieldUpdates.field',
                row,
            ),
        ),
        ...rows(json, 'alerts').flatMap((row) =>
            ref('emailTemplate', str(row.template), 'alerts.template', row),
        ),
        ...rows(json, 'rules').flatMap((row) =>
            criteriaFieldRefs(row.criteriaItems, 'rules.criteriaItems', row, name),
        ),
    ],
    approvalProcess: ({ json, name }) => {
        const object = name.split('.')[0];
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
    queue: ({ json }) => [
        ...rows(json, 'queueSobject').flatMap((row) =>
            ref('object', str(row.sobjectType), 'queueSobject', row),
        ),
        ...principalRefs(json.queueMembers, 'queueMembers', json),
    ],
    role: ({ json }) => ref('role', str(json.parentRole), 'parentRole', json),
    namedCredential: ({ json }) =>
        rows(json, 'namedCredentialParameters').flatMap((row) =>
            ref(
                'externalCredential',
                str(row.externalCredential),
                'namedCredentialParameters.externalCredential',
                row,
            ),
        ),
    assignmentRules: caseRuleRefs('assignmentRule'),
    autoResponseRules: caseRuleRefs('autoResponseRule'),
    escalationRules: caseRuleRefs('escalationRule'),
    pathAssistant: ({ json }) => {
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
                strings(step, 'fieldNames').flatMap((fieldName) =>
                    ref(
                        'field',
                        object ? `${object}.${fieldName}` : undefined,
                        'pathAssistantSteps.fieldNames',
                        step,
                    ),
                ),
            ),
        ];
    },
    duplicateRule: ({ json, name }) => [
        ...ref('object', name.split('.')[0], 'fullName', json),
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
    matchingRules: ({ json, name }) => [
        ...ref('object', name, 'fullName', json),
        ...rows(json, 'matchingRules').flatMap((rule) =>
            metadataValuesOf(rule.matchingRuleItems, 'fieldName').flatMap((field) =>
                ref('field', `${name}.${field}`, 'matchingRules.matchingRuleItems', rule),
            ),
        ),
    ],
    platformEventChannelMember: ({ json }) => [
        ...ref('platformEventChannel', str(json.eventChannel), 'eventChannel', json),
        ...ref('object', eventEntityObject(str(json.selectedEntity)), 'selectedEntity', json),
    ],
    platformEventSubscriberConfig: ({ json }) =>
        ref('apexTrigger', str(json.platformEventConsumer), 'platformEventConsumer', json),
};

// ---------------------------------------------------------------------------
// 数式 (どの種類も)
// ---------------------------------------------------------------------------

/** 数式を持つプロパティ (Flow の数式・ワークフローのルール・承認の条件など) */
const FORMULA_KEYS = new Set(['formula', 'expression', 'errorConditionFormula', 'filterFormula']);

const formulaRefInfo = (r: FormulaReference, via: string): MetadataRefInfo => {
    switch (r.refType) {
        case 'field':
            return { refType: 'field', target: `${r.object}.${r.field}`, kind: 'reads', via };
        case 'object':
            return { refType: 'object', target: r.name, kind: 'reads', via };
        default:
            return { refType: r.refType, target: r.name, kind: 'uses', via };
    }
};

/**
 * JSON の中の数式 (FORMULA_KEYS のプロパティ) の参照。文は数式を持つノード (直前の境界ノード)。
 * 数式の JSON (段階 M4) は名前のノードを expression に持つ。値の木の中の数式 (文字列) は読んでから取る
 */
const formulaRefs = ({ json, name, dataType }: RefSource): MetadataRefInfo[] => {
    const found: MetadataRefInfo[] = [];
    const push = (key: string, formula: FormulaValue, context: MetadataWalkContext) => {
        for (const r of formulaReferencesOf(formula, context.object)) {
            found.push({
                ...formulaRefInfo(r, `formula.${key}`),
                ...(context.member ? { member: `${name}.${context.member}` } : {}),
                ...(context.statement ? { statement: context.statement } : {}),
                ...(r.expression ? { expression: r.expression } : {}),
            });
        }
    };
    walkMetadataJson(
        json,
        {
            record: (node, context) => {
                if (!isFormulaNode(node)) return;
                const key = context.path.at(-1);
                if (key !== undefined && FORMULA_KEYS.has(key)) push(key, node as FxJson, context);
                // 数式の中は見ない (名前は formulaReferencesOf で取った)
                return false;
            },
            value: (key, value, _owner, context) => {
                if (FORMULA_KEYS.has(key)) push(key, value, context);
            },
        },
        initialMetadataWalkContext(dataType, json, name),
    );
    return found;
};

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

/**
 * 同じ場所 (メンバー・文) の同じ参照先は 1 つにする。
 * kind は uses より細かいもの (grants / reads / places など) を残す。
 * 式 (数式の名前のノードなど) の位置は比べず、どれかが持っていれば残す
 */
const mergeRefs = (refs: MetadataRefInfo[]): MetadataRefInfo[] => {
    const merged = new Map<string, MetadataRefInfo>();
    for (const r of refs) {
        const key = JSON.stringify([r.refType, r.target, r.member, r.statement?.sourceKey]);
        const existing = merged.get(key);
        if (!existing) {
            merged.set(key, r);
            continue;
        }
        const kept = existing.kind === 'uses' && r.kind !== 'uses' ? r : existing;
        const expression = kept.expression ?? existing.expression ?? r.expression;
        merged.set(key, expression ? { ...kept, expression } : kept);
    }
    return [...merged.values()];
};

/**
 * フォルダ単位のメタデータの単位 1 つの参照 (依存関係のグラフが使う)。
 * dataType は単位の種類、name は単位の名前 (fullName など)
 */
export const analyzeMetadataRefs = (
    dataType: string,
    json: Record<string, unknown>,
    name: string,
): MetadataRefInfo[] => {
    const source: RefSource = { json: json as Json, name, dataType };
    return mergeRefs([...(EXTRACTORS[dataType]?.(source) ?? []), ...formulaRefs(source)]);
};
