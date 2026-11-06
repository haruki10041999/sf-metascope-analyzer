import type { SourcePosition } from '../commons/source';
import { ErrorJson, JsonType } from '../commons/json';

import {
    XmlFile,
    XmlSourceRegistry,
    PropertiesOf,
    ParsedXmlFile,
    XmlReadProblem,
    readXmlRoot,
    makeXmlJson,
    nonEmptyEntry,
    readProperties,
    unknownChildNames,
    readTexts,
} from '../commons/xmlJson';
import { CompactLayoutJson, makeCompactLayoutJson } from './compactLayout';
import { CustomFieldJson, makeCustomFieldJson } from './field';
import { FieldSetJson, makeFieldSetJson } from './fieldSet';
import { ListViewJson, makeListViewJson } from './listView';
import { RecordTypeJson, makeRecordTypeJson } from './recordType';
import { ValidationRuleJson, makeValidationRuleJson } from './validationRule';
import { WebLinkJson, makeWebLinkJson } from './webLink';
import {
    BusinessProcessJson,
    SharingReasonJson,
    makeBusinessProcessJson,
    makeSharingReasonJson,
} from './businessProcess';
import { XmlElement, childOf, childrenOf } from '../commons/xml';

/** API 名の接尾辞から決まるオブジェクトの種類 */
export type ObjectType =
    'standard' | 'custom' | 'customMetadata' | 'platformEvent' | 'bigObject' | 'externalObject';

export const getObjectType = (apiName: string): ObjectType => {
    if (apiName.endsWith('__c')) return 'custom';
    if (apiName.endsWith('__mdt')) return 'customMetadata';
    if (apiName.endsWith('__e')) return 'platformEvent';
    if (apiName.endsWith('__b')) return 'bigObject';
    if (apiName.endsWith('__x')) return 'externalObject';
    return 'standard';
};

export const OBJECT_SCHEMA = {
    label: 'string',
    pluralLabel: 'string',
    description: 'string',
    sharingModel: 'string',
    externalSharingModel: 'string',
    deploymentStatus: 'string',
    visibility: 'string',
    enableActivities: 'boolean',
    enableBulkApi: 'boolean',
    enableFeeds: 'boolean',
    enableHistory: 'boolean',
    enableReports: 'boolean',
    enableSearch: 'boolean',
    enableSharing: 'boolean',
    enableStreamingApi: 'boolean',
} as const;

/** 検索レイアウト (`<searchLayouts>`)。どれも項目・ボタンの API 名の並び (表示順) */
export const SEARCH_LAYOUT_LISTS = [
    'customTabListAdditionalFields',
    'excludedStandardButtons',
    'listViewButtons',
    'lookupDialogsAdditionalFields',
    'lookupFilterFields',
    'lookupPhoneDialogsAdditionalFields',
    'massQuickActions',
    'searchFilterFields',
    'searchResultsAdditionalFields',
    'searchResultsCustomButtons',
] as const;

export type SearchLayoutsJson = Partial<Record<(typeof SEARCH_LAYOUT_LISTS)[number], string[]>>;

export const OBJECT_ACTION_OVERRIDE_SCHEMA = {
    actionName: 'string',
    comment: 'string',
    content: 'string',
    formFactor: 'string',
    skipRecordTypeSelect: 'boolean',
    type: 'string',
} as const;

/** 標準のボタン・アクションの上書き (`<actionOverrides>`。キーは actionName + formFactor) */
export type ObjectActionOverrideJson = JsonType<'objectActionOverride'> &
    PropertiesOf<typeof OBJECT_ACTION_OVERRIDE_SCHEMA>;

/** 名前項目 (`<nameField>`)。type は Text か AutoNumber */
export type NameFieldJson = { label?: string; type?: string; displayFormat?: string };

/**
 * オブジェクト。<名前>.object-meta.xml と、フォルダの中の項目・入力規則などのファイルを 1 つにまとめたもの。
 * 子の並びは、object-meta.xml の中に書かれたもの (メタデータ API の形式) のあとに、ファイル名の順で並べる
 */
export type CustomObjectJson = JsonType<'object'> & {
    apiName: string;
    objectType: ObjectType;
    nameField?: NameFieldJson;
    // 子は、フォルダにも object-meta.xml の中にもなければ持たない
    fields?: (CustomFieldJson | ErrorJson)[];
    validationRules?: (ValidationRuleJson | ErrorJson)[];
    recordTypes?: (RecordTypeJson | ErrorJson)[];
    listViews?: (ListViewJson | ErrorJson)[];
    fieldSets?: (FieldSetJson | ErrorJson)[];
    compactLayouts?: (CompactLayoutJson | ErrorJson)[];
    webLinks?: (WebLinkJson | ErrorJson)[];
    businessProcesses?: (BusinessProcessJson | ErrorJson)[];
    sharingReasons?: (SharingReasonJson | ErrorJson)[];
    /** object-meta.xml の中の検索レイアウト */
    searchLayouts?: SearchLayoutsJson;
    /** object-meta.xml の中のアクションの上書き */
    actionOverrides?: ObjectActionOverrideJson[];
    /** object-meta.xml の要素のうち、読んでいないものの名前 (最初に出た順) */
    skippedElements?: string[];
} & PropertiesOf<typeof OBJECT_SCHEMA>;

type MemberMaker = (
    element: XmlElement,
    name: string,
    file: XmlFile,
    registry: XmlSourceRegistry,
) => JsonType<string>;

/**
 * オブジェクトの子の種類。sfdx の形式ではフォルダ (folder) に 1 つずつファイル (<名前><suffix>、ルート要素は root) があり、
 * メタデータ API の形式では object-meta.xml の中に element の要素として並ぶ
 */
export const OBJECT_MEMBERS = {
    fields: {
        kind: 'field',
        folder: 'fields',
        suffix: '.field-meta.xml',
        root: 'CustomField',
        element: 'fields',
        make: makeCustomFieldJson,
    },
    validationRules: {
        kind: 'validationRule',
        folder: 'validationRules',
        suffix: '.validationRule-meta.xml',
        root: 'ValidationRule',
        element: 'validationRules',
        make: makeValidationRuleJson,
    },
    recordTypes: {
        kind: 'recordType',
        folder: 'recordTypes',
        suffix: '.recordType-meta.xml',
        root: 'RecordType',
        element: 'recordTypes',
        make: makeRecordTypeJson,
    },
    listViews: {
        kind: 'listView',
        folder: 'listViews',
        suffix: '.listView-meta.xml',
        root: 'ListView',
        element: 'listViews',
        make: makeListViewJson,
    },
    fieldSets: {
        kind: 'fieldSet',
        folder: 'fieldSets',
        suffix: '.fieldSet-meta.xml',
        root: 'FieldSet',
        element: 'fieldSets',
        make: makeFieldSetJson,
    },
    compactLayouts: {
        kind: 'compactLayout',
        folder: 'compactLayouts',
        suffix: '.compactLayout-meta.xml',
        root: 'CompactLayout',
        element: 'compactLayouts',
        make: makeCompactLayoutJson,
    },
    webLinks: {
        kind: 'webLink',
        folder: 'webLinks',
        suffix: '.webLink-meta.xml',
        root: 'WebLink',
        element: 'webLinks',
        make: makeWebLinkJson,
    },
    businessProcesses: {
        kind: 'businessProcess',
        folder: 'businessProcesses',
        suffix: '.businessProcess-meta.xml',
        root: 'BusinessProcess',
        element: 'businessProcesses',
        make: makeBusinessProcessJson,
    },
    sharingReasons: {
        kind: 'sharingReason',
        folder: 'sharingReasons',
        suffix: '.sharingReason-meta.xml',
        root: 'SharingReason',
        element: 'sharingReasons',
        make: makeSharingReasonJson,
    },
} as const satisfies Record<
    string,
    {
        kind: string;
        folder: string;
        suffix: string;
        root: string;
        element: string;
        make: MemberMaker;
    }
>;

export type ObjectMemberKey = keyof typeof OBJECT_MEMBERS;

export const OBJECT_SUFFIX = '.object-meta.xml';

export type ObjectSource = {
    apiName: string;
    /** <名前>.object-meta.xml (標準オブジェクトなどで、ないこともある) */
    objectFile?: ParsedXmlFile;
    members: Record<ObjectMemberKey, ParsedXmlFile[]>;
};

/** object-meta.xml の要素のうち読むもの (これ以外は skippedElements に残す) */
const OBJECT_KNOWN_ELEMENTS = [
    'fullName',
    ...Object.keys(OBJECT_SCHEMA),
    'nameField',
    'searchLayouts',
    'actionOverrides',
    ...Object.values(OBJECT_MEMBERS).map((member) => member.element),
];

/** 検索レイアウト。要素がなければ持たない (保存済みのオブジェクトの objectKey を変えないため) */
const searchLayoutsEntry = (
    objectElement: XmlElement | undefined,
): { searchLayouts?: SearchLayoutsJson } => {
    const element = objectElement ? childOf(objectElement, 'searchLayouts') : undefined;
    if (!element) return {};
    const layouts = Object.fromEntries(
        SEARCH_LAYOUT_LISTS.flatMap((name) => {
            const values = readTexts(element, name);
            return values.length ? [[name, values]] : [];
        }),
    );
    return Object.keys(layouts).length ? { searchLayouts: layouts } : {};
};

/** オブジェクトのフォルダから読んだファイルを、CustomObjectJson にする */
export const makeCustomObjectJson = (
    source: ObjectSource,
    registry: XmlSourceRegistry,
): { object: CustomObjectJson; problems: XmlReadProblem[] } => {
    const problems: XmlReadProblem[] = [];
    const rootOf = (file: ParsedXmlFile, root: string, kindType: string) =>
        readXmlRoot(file, root, kindType, registry, problems);

    const objectFile: XmlFile = source.objectFile ?? {
        filePath: `${source.apiName}/${source.apiName}${OBJECT_SUFFIX}`,
        source: '',
    };
    const objectRoot = source.objectFile
        ? rootOf(source.objectFile, 'CustomObject', 'object')
        : undefined;
    const objectElement = objectRoot && 'name' in objectRoot ? objectRoot : undefined;

    const members = Object.fromEntries(
        (Object.keys(OBJECT_MEMBERS) as ObjectMemberKey[]).flatMap((key) => {
            const { kind, root, element, make } = OBJECT_MEMBERS[key];
            const make_ = make as MemberMaker;
            // メタデータ API の形式: object-meta.xml の中の要素
            const embedded = objectElement
                ? childrenOf(objectElement, element).map((child) =>
                      make_(child, '', objectFile, registry),
                  )
                : [];
            // sfdx の形式: フォルダの中のファイル
            const files = source.members[key].map((file) => {
                const memberRoot = rootOf(file, root, kind);
                return 'name' in memberRoot
                    ? make_(memberRoot, file.name, file, registry)
                    : memberRoot;
            });
            const items = [...embedded, ...files];
            return items.length === 0 ? [] : [[key, items] as const];
        }),
    ) as Pick<CustomObjectJson, ObjectMemberKey>;

    const nameField = objectElement ? childOf(objectElement, 'nameField') : undefined;
    const object = makeXmlJson<CustomObjectJson>(
        'object',
        {
            apiName: source.apiName,
            objectType: getObjectType(source.apiName),
            ...readProperties(objectElement, OBJECT_SCHEMA),
            ...(nameField
                ? {
                      nameField: readProperties(nameField, {
                          label: 'string',
                          type: 'string',
                          displayFormat: 'string',
                      }),
                  }
                : {}),
            ...members,
            ...searchLayoutsEntry(objectElement),
            ...nonEmptyEntry(
                'actionOverrides',
                (objectElement ? childrenOf(objectElement, 'actionOverrides') : []).map(
                    (override) =>
                        makeXmlJson<ObjectActionOverrideJson>(
                            'objectActionOverride',
                            readProperties(override, OBJECT_ACTION_OVERRIDE_SCHEMA),
                            override,
                            objectFile,
                            registry,
                        ),
                ),
            ),
            ...nonEmptyEntry(
                'skippedElements',
                objectElement ? unknownChildNames(objectElement, OBJECT_KNOWN_ELEMENTS) : [],
            ),
        },
        objectElement,
        objectFile,
        registry,
    );

    return { object, problems };
};
