import type { ErrorJson, JsonType } from '../commons/json';
import { childOf, childrenOf, type XmlElement } from '../commons/xml';
import {
    makeMetadataJson,
    nonEmptyEntry,
    readProperties,
    readTexts,
    readXmlRoot,
    unknownChildNames,
    type ParsedXmlFile,
    type PropertiesOf,
    type PropertySchema,
    type XmlFile,
    type XmlReadProblem,
    type XmlSourceRegistry,
} from '../commons/xmlJson';

// 権限 (PermissionSet / MutingPermissionSet / Profile / PermissionSetGroup) の JSON。方針: docs/metadata-a-plan.md 3・4 章
// 権限の 1 行 (objectPermissions など) は、要素名 → kind・値のスキーマ・キーの表 (行の表) で読む。
// 値は XML の要素名をプロパティ名にし、ファイルにないものは持たない。子の並びは XML の順のまま

/** 行の表の 1 行。key は行を対応付けるキー (Diff の D)、lists は繰り返す値の要素 (文字列の並び) */
export type PermissionRowSpec = {
    kind: string;
    schema: PropertySchema;
    key: readonly string[];
    lists?: readonly string[];
};

/** 対象の名前 + enabled の形の行 (classAccesses など) */
const access = <K extends string, T extends string>(kind: K, target: T) =>
    ({
        kind,
        schema: { [target]: 'string', enabled: 'boolean' } as { [P in T]: 'string' } & {
            enabled: 'boolean';
        },
        key: [target] as const,
    }) satisfies PermissionRowSpec;

/** PermissionSet・Profile の両方にある行 */
const SHARED_ROWS = {
    applicationVisibilities: {
        kind: 'applicationVisibility',
        schema: { application: 'string', default: 'boolean', visible: 'boolean' },
        key: ['application'],
    },
    classAccesses: access('classAccess', 'apexClass'),
    customMetadataTypeAccesses: access('customMetadataTypeAccess', 'name'),
    customPermissions: access('customPermissionAccess', 'name'),
    customSettingAccesses: access('customSettingAccess', 'name'),
    externalDataSourceAccesses: access('externalDataSourceAccess', 'externalDataSource'),
    externalCredentialPrincipalAccesses: access(
        'externalCredentialPrincipalAccess',
        'externalCredentialPrincipal',
    ),
    emailRoutingAddressAccesses: access('emailRoutingAddressAccess', 'emailRoutingAddress'),
    servicePresenceStatusAccesses: access('servicePresenceStatusAccess', 'servicePresenceStatus'),
    agentAccesses: access('agentAccess', 'agentName'),
    fieldPermissions: {
        kind: 'fieldPermission',
        schema: { field: 'string', readable: 'boolean', editable: 'boolean' },
        key: ['field'],
    },
    flowAccesses: access('flowAccess', 'flow'),
    objectPermissions: {
        kind: 'objectPermission',
        schema: {
            object: 'string',
            allowCreate: 'boolean',
            allowRead: 'boolean',
            allowEdit: 'boolean',
            allowDelete: 'boolean',
            viewAllRecords: 'boolean',
            modifyAllRecords: 'boolean',
            viewAllFields: 'boolean',
        },
        key: ['object'],
    },
    pageAccesses: access('pageAccess', 'apexPage'),
    recordTypeVisibilities: {
        kind: 'recordTypeVisibility',
        schema: {
            recordType: 'string',
            visible: 'boolean',
            default: 'boolean',
            personAccountDefault: 'boolean',
        },
        key: ['recordType'],
    },
    userPermissions: access('userPermission', 'name'),
} as const satisfies Record<string, PermissionRowSpec>;

/** PermissionSet・MutingPermissionSet の行 */
export const PERMISSION_SET_ROWS = {
    ...SHARED_ROWS,
    tabSettings: {
        kind: 'tabSetting',
        schema: { tab: 'string', visibility: 'string' },
        key: ['tab'],
    },
} as const satisfies Record<string, PermissionRowSpec>;

/** Profile の行 */
export const PROFILE_ROWS = {
    ...SHARED_ROWS,
    tabVisibilities: {
        kind: 'tabVisibility',
        schema: { tab: 'string', visibility: 'string' },
        key: ['tab'],
    },
    layoutAssignments: {
        kind: 'layoutAssignment',
        schema: { layout: 'string', recordType: 'string' },
        key: ['layout', 'recordType'],
    },
    loginIpRanges: {
        kind: 'loginIpRange',
        schema: { startAddress: 'string', endAddress: 'string', description: 'string' },
        key: ['startAddress', 'endAddress'],
    },
    loginFlows: {
        kind: 'loginFlow',
        schema: {
            flow: 'string',
            vfFlowPage: 'string',
            vfFlowPageTitle: 'string',
            flowType: 'string',
            friendlyName: 'string',
            uiLoginFlowType: 'string',
            useLightningRuntime: 'boolean',
        },
        key: ['flow', 'vfFlowPage'],
    },
    profileActionOverrides: {
        kind: 'profileActionOverride',
        schema: {
            actionName: 'string',
            content: 'string',
            formFactor: 'string',
            pageOrSobjectType: 'string',
            recordType: 'string',
            type: 'string',
        },
        key: ['pageOrSobjectType', 'recordType', 'formFactor', 'actionName'],
    },
    categoryGroupVisibilities: {
        kind: 'categoryGroupVisibility',
        schema: { dataCategoryGroup: 'string', visibility: 'string' },
        key: ['dataCategoryGroup'],
        lists: ['dataCategories'],
    },
} as const satisfies Record<string, PermissionRowSpec>;

/** 行の JSON (権限の 1 行) */
export type PermissionRowJson<S extends PermissionRowSpec = PermissionRowSpec> = JsonType<
    S['kind']
> &
    PropertiesOf<S['schema']> & {
        [L in NonNullable<S['lists']>[number]]?: string[];
    };

/** 行の表から作る、要素名ごとの行の並び (ファイルにない要素は持たない) */
export type PermissionRowsJson<R extends Record<string, PermissionRowSpec>> = {
    [E in keyof R]?: PermissionRowJson<R[E]>[];
};

/** 行を対応付けるキー (key の値を | でつないだもの) */
export const permissionRowKey = (spec: PermissionRowSpec, row: object): string =>
    spec.key.map((name) => String((row as Record<string, unknown>)[name] ?? '')).join('|');

export const PERMISSION_SET_SCHEMA = {
    label: 'string',
    description: 'string',
    license: 'string',
    userLicense: 'string',
    hasActivationRequired: 'boolean',
} as const;

export const MUTING_PERMISSION_SET_SCHEMA = {
    label: 'string',
    description: 'string',
} as const;

export const PROFILE_SCHEMA = {
    custom: 'boolean',
    description: 'string',
    userLicense: 'string',
} as const;

/** Profile のログインできる時間 (曜日ごとの開始・終了。0 時からの分) */
export const LOGIN_HOURS_SCHEMA = Object.fromEntries(
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].flatMap(
        (day) => [
            [`${day}Start`, 'number'],
            [`${day}End`, 'number'],
        ],
    ),
) as Record<
    `${'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'}${'Start' | 'End'}`,
    'number'
>;

export type LoginHoursJson = JsonType<'loginHours'> & PropertiesOf<typeof LOGIN_HOURS_SCHEMA>;

/** 権限のルートの共通の形。name はファイル名から接尾辞を除いたもの */
type PermissionsRootJson<
    K extends string,
    S extends PropertySchema,
    R extends Record<string, PermissionRowSpec>,
> = JsonType<K> & { name: string } & PropertiesOf<S> &
    PermissionRowsJson<R> & {
        /** スキーマにない要素の名前 (読んでいないもの) */
        skippedElements?: string[];
    };

export type PermissionSetJson = PermissionsRootJson<
    'permissionSet',
    typeof PERMISSION_SET_SCHEMA,
    typeof PERMISSION_SET_ROWS
>;

export type MutingPermissionSetJson = PermissionsRootJson<
    'mutingPermissionSet',
    typeof MUTING_PERMISSION_SET_SCHEMA,
    typeof PERMISSION_SET_ROWS
>;

export type ProfileJson = PermissionsRootJson<
    'profile',
    typeof PROFILE_SCHEMA,
    typeof PROFILE_ROWS
> & {
    loginHours?: LoginHoursJson;
};

export const PERMISSION_SET_GROUP_SCHEMA = {
    label: 'string',
    description: 'string',
    status: 'string',
    hasActivationRequired: 'boolean',
} as const;

/** 権限セットグループ。含む権限セット・ミュート権限セットは名前の集合 (B) */
export type PermissionSetGroupJson = JsonType<'permissionSetGroup'> & {
    name: string;
    permissionSets?: string[];
    mutingPermissionSets?: string[];
    skippedElements?: string[];
} & PropertiesOf<typeof PERMISSION_SET_GROUP_SCHEMA>;

/** 権限セット・ミュート権限セット・Profile のどれか */
export type PermissionsJson = PermissionSetJson | MutingPermissionSetJson | ProfileJson;

// ---------------------------------------------------------------------------
// XML → JSON
// ---------------------------------------------------------------------------

const readRows = <R extends Record<string, PermissionRowSpec>>(
    element: XmlElement,
    rows: R,
    file: XmlFile,
    registry: XmlSourceRegistry,
): PermissionRowsJson<R> =>
    Object.fromEntries(
        Object.entries(rows).flatMap(([name, spec]) => {
            const items = childrenOf(element, name).map((row) =>
                makeMetadataJson<JsonType<string>>(
                    spec.kind,
                    {
                        ...readProperties(row, spec.schema),
                        ...Object.fromEntries(
                            (spec.lists ?? []).flatMap((list) => {
                                const values = readTexts(row, list);
                                return values.length ? [[list, values]] : [];
                            }),
                        ),
                    } as Omit<JsonType<string>, 'kind' | 'sourceKeys'>,
                    row,
                    file,
                    registry,
                ),
            );
            return items.length ? [[name, items]] : [];
        }),
    ) as PermissionRowsJson<R>;

const skippedEntry = (element: XmlElement, known: string[]) =>
    nonEmptyEntry('skippedElements', unknownChildNames(element, known));

type MakeJson<J> = (
    file: ParsedXmlFile,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
) => J | ErrorJson;

const makePermissionsJson =
    <K extends string, S extends PropertySchema, R extends Record<string, PermissionRowSpec>>(
        kind: K,
        root: string,
        schema: S,
        rows: R,
    ): MakeJson<PermissionsRootJson<K, S, R>> =>
    (file, registry, problems) => {
        const element = readXmlRoot(file, root, kind, registry, problems);
        if (!('name' in element)) return element;
        return makeMetadataJson<JsonType<K>>(
            kind,
            {
                name: file.name,
                ...readProperties(element, schema),
                ...readRows(element, rows, file, registry),
                ...skippedEntry(element, [...Object.keys(schema), ...Object.keys(rows)]),
            } as Omit<JsonType<K>, 'kind' | 'sourceKeys'>,
            element,
            file,
            registry,
        ) as PermissionsRootJson<K, S, R>;
    };

/** permissionsets/<名前>.permissionset-meta.xml */
export const makePermissionSetJson: MakeJson<PermissionSetJson> = makePermissionsJson(
    'permissionSet',
    'PermissionSet',
    PERMISSION_SET_SCHEMA,
    PERMISSION_SET_ROWS,
);

/** mutingpermissionsets/<名前>.mutingpermissionset-meta.xml。PermissionSet と同じ行の表で読む */
export const makeMutingPermissionSetJson: MakeJson<MutingPermissionSetJson> = makePermissionsJson(
    'mutingPermissionSet',
    'MutingPermissionSet',
    MUTING_PERMISSION_SET_SCHEMA,
    PERMISSION_SET_ROWS,
);

/** profiles/<名前>.profile-meta.xml。すべての要素を読み、表にない要素は skippedElements に残す */
export const makeProfileJson: MakeJson<ProfileJson> = (file, registry, problems) => {
    const element = readXmlRoot(file, 'Profile', 'profile', registry, problems);
    if (!('name' in element)) return element;
    const loginHours = childOf(element, 'loginHours');
    return makeMetadataJson<ProfileJson>(
        'profile',
        {
            name: file.name,
            ...readProperties(element, PROFILE_SCHEMA),
            ...readRows(element, PROFILE_ROWS, file, registry),
            ...(loginHours
                ? {
                      loginHours: makeMetadataJson<LoginHoursJson>(
                          'loginHours',
                          readProperties(loginHours, LOGIN_HOURS_SCHEMA),
                          loginHours,
                          file,
                          registry,
                      ),
                  }
                : {}),
            ...skippedEntry(element, [
                ...Object.keys(PROFILE_SCHEMA),
                ...Object.keys(PROFILE_ROWS),
                'loginHours',
            ]),
        },
        element,
        file,
        registry,
    );
};

/** permissionsetgroups/<名前>.permissionsetgroup-meta.xml */
export const makePermissionSetGroupJson: MakeJson<PermissionSetGroupJson> = (
    file,
    registry,
    problems,
) => {
    const element = readXmlRoot(
        file,
        'PermissionSetGroup',
        'permissionSetGroup',
        registry,
        problems,
    );
    if (!('name' in element)) return element;
    return makeMetadataJson<PermissionSetGroupJson>(
        'permissionSetGroup',
        {
            name: file.name,
            ...readProperties(element, PERMISSION_SET_GROUP_SCHEMA),
            ...nonEmptyEntry('permissionSets', readTexts(element, 'permissionSets')),
            ...nonEmptyEntry('mutingPermissionSets', readTexts(element, 'mutingPermissionSets')),
            ...skippedEntry(element, [
                ...Object.keys(PERMISSION_SET_GROUP_SCHEMA),
                'permissionSets',
                'mutingPermissionSets',
            ]),
        },
        element,
        file,
        registry,
    );
};
