import { ErrorJson, JsonType } from '../commons/json';

import {
    ParsedXmlFile,
    PropertiesOf,
    XmlFile,
    XmlReadProblem,
    XmlSourceRegistry,
    makeXmlJson,
    nonEmptyEntry,
    readProperties,
    readText,
    readXmlRoot,
} from '../commons/xmlJson';
import { XmlElement, childOf, childrenOf } from '../commons/xml';

// 方針: docs/object-translation.md
// オブジェクトの翻訳 (objectTranslations/<オブジェクト>-<言語>/)。オブジェクトとは別のファイルなので、別の解析結果にする

export const OBJECT_TRANSLATION_SUFFIX = '.objectTranslation-meta.xml';
export const FIELD_TRANSLATION_SUFFIX = '.fieldTranslation-meta.xml';

/** フォルダ名 (<オブジェクト>-<言語>) を分ける。API 名は '-' を含まないので、最後の '-' で分ける */
export const splitTranslationName = (name: string): { objectApiName: string; locale: string } => {
    const index = name.lastIndexOf('-');
    return index === -1
        ? { objectApiName: name, locale: '' }
        : { objectApiName: name.slice(0, index), locale: name.slice(index + 1) };
};

// ---------------------------------------------------------------------------
// 項目の翻訳 (<項目>.fieldTranslation-meta.xml / objectTranslation-meta.xml の <fields>)
// ---------------------------------------------------------------------------

/** 選択リスト値の翻訳。masterLabel は翻訳元 (既定の言語) の値のラベル */
export type PicklistValueTranslationJson = JsonType<'picklistValueTranslation'> & {
    masterLabel: string;
    translation?: string;
};

export const FIELD_TRANSLATION_SCHEMA = {
    label: 'string',
    help: 'string',
    relationshipLabel: 'string',
    description: 'string',
} as const;

/** 参照の絞り込み条件のメッセージの翻訳 */
export type LookupFilterTranslationJson = { errorMessage?: string; informationalMessage?: string };

export type CustomFieldTranslationJson = JsonType<'fieldTranslation'> & {
    /** 項目の API 名 */
    name: string;
    picklistValues?: PicklistValueTranslationJson[];
    lookupFilter?: LookupFilterTranslationJson;
} & PropertiesOf<typeof FIELD_TRANSLATION_SCHEMA>;

export const makePicklistValueTranslationJson = (
    element: XmlElement,
    file: XmlFile,
    registry: XmlSourceRegistry,
): PicklistValueTranslationJson =>
    makeXmlJson<PicklistValueTranslationJson>(
        'picklistValueTranslation',
        {
            masterLabel: readText(element, 'masterLabel') ?? '',
            ...readProperties(element, { translation: 'string' }),
        },
        element,
        file,
        registry,
    );

export const makeCustomFieldTranslationJson = (
    element: XmlElement,
    name: string,
    file: XmlFile,
    registry: XmlSourceRegistry,
): CustomFieldTranslationJson => {
    const lookupFilter = childOf(element, 'lookupFilter');
    return makeXmlJson<CustomFieldTranslationJson>(
        'fieldTranslation',
        {
            name: readText(element, 'name') ?? name,
            ...readProperties(element, FIELD_TRANSLATION_SCHEMA),
            ...nonEmptyEntry(
                'picklistValues',
                childrenOf(element, 'picklistValues').map((value) =>
                    makePicklistValueTranslationJson(value, file, registry),
                ),
            ),
            ...(lookupFilter
                ? {
                      lookupFilter: readProperties(lookupFilter, {
                          errorMessage: 'string',
                          informationalMessage: 'string',
                      }),
                  }
                : {}),
        },
        element,
        file,
        registry,
    );
};

// ---------------------------------------------------------------------------
// objectTranslation-meta.xml の中の、名前で識別する翻訳
// ---------------------------------------------------------------------------

/** レイアウトのセクション名の翻訳 */
export type LayoutSectionTranslationJson = { section: string; label?: string };

/**
 * 名前で識別する翻訳の種類。element は XML の要素名、nameKey は名前の要素、schema は翻訳の値。
 * kind は `${種類}Translation`
 */
export const TRANSLATION_MEMBERS = {
    recordTypes: {
        kind: 'recordTypeTranslation',
        element: 'recordTypes',
        nameKey: 'name',
        schema: { label: 'string', description: 'string' },
    },
    validationRules: {
        kind: 'validationRuleTranslation',
        element: 'validationRules',
        nameKey: 'name',
        schema: { errorMessage: 'string' },
    },
    webLinks: {
        kind: 'webLinkTranslation',
        element: 'webLinks',
        nameKey: 'name',
        schema: { label: 'string' },
    },
    quickActions: {
        kind: 'quickActionTranslation',
        element: 'quickActions',
        nameKey: 'name',
        schema: { label: 'string' },
    },
    fieldSets: {
        kind: 'fieldSetTranslation',
        element: 'fieldSets',
        nameKey: 'name',
        schema: { label: 'string' },
    },
    sharingReasons: {
        kind: 'sharingReasonTranslation',
        element: 'sharingReasons',
        nameKey: 'name',
        schema: { label: 'string' },
    },
    standardFields: {
        kind: 'standardFieldTranslation',
        element: 'standardFields',
        nameKey: 'name',
        schema: { label: 'string' },
    },
    layouts: {
        kind: 'layoutTranslation',
        element: 'layouts',
        nameKey: 'layout',
        schema: { layoutType: 'string' },
    },
} as const;

export type TranslationMemberKey = keyof typeof TRANSLATION_MEMBERS;

type MemberDefinition<K extends TranslationMemberKey> = (typeof TRANSLATION_MEMBERS)[K];

/** 名前で識別する翻訳 1 つ (layouts はセクション名の翻訳も持つ) */
export type TranslationMemberJson<K extends TranslationMemberKey = TranslationMemberKey> =
    K extends TranslationMemberKey
        ? JsonType<MemberDefinition<K>['kind']> & {
              [P in MemberDefinition<K>['nameKey']]: string;
          } & PropertiesOf<MemberDefinition<K>['schema']> &
              (K extends 'layouts' ? { sections?: LayoutSectionTranslationJson[] } : {})
        : never;

export type RecordTypeTranslationJson = TranslationMemberJson<'recordTypes'>;
export type ValidationRuleTranslationJson = TranslationMemberJson<'validationRules'>;
export type WebLinkTranslationJson = TranslationMemberJson<'webLinks'>;
export type QuickActionTranslationJson = TranslationMemberJson<'quickActions'>;
export type FieldSetTranslationJson = TranslationMemberJson<'fieldSets'>;
export type SharingReasonTranslationJson = TranslationMemberJson<'sharingReasons'>;
export type StandardFieldTranslationJson = TranslationMemberJson<'standardFields'>;
export type LayoutTranslationJson = TranslationMemberJson<'layouts'>;

/** 名前で識別する翻訳の名前 (layouts は layout、それ以外は name) */
export const getTranslationMemberName = (member: TranslationMemberJson): string =>
    member.kind === 'layoutTranslation' ? member.layout : (member as { name: string }).name;

export const makeTranslationMemberJson = <K extends TranslationMemberKey>(
    key: K,
    element: XmlElement,
    file: XmlFile,
    registry: XmlSourceRegistry,
): TranslationMemberJson<K> => {
    const { kind, nameKey, schema } = TRANSLATION_MEMBERS[key];
    const sections =
        key === 'layouts'
            ? nonEmptyEntry(
                  'sections',
                  childrenOf(element, 'sections').map((section) => ({
                      section: readText(section, 'section') ?? '',
                      ...readProperties(section, { label: 'string' }),
                  })),
              )
            : {};
    return makeXmlJson<TranslationMemberJson<K>>(
        kind as TranslationMemberJson<K>['kind'],
        {
            [nameKey]: readText(element, nameKey) ?? '',
            ...readProperties(element, schema),
            ...sections,
        } as unknown as Omit<TranslationMemberJson<K>, 'kind' | 'sourceKeys'>,
        element,
        file,
        registry,
    );
};

// ---------------------------------------------------------------------------
// オブジェクトの翻訳
// ---------------------------------------------------------------------------

/** 名詞の格 (ドイツ語などの言語で使う)。名前を持たないので集合として比べる */
export type CaseValueJson = {
    value?: string;
    plural?: boolean;
    caseType?: string;
    possessive?: string;
    article?: string;
};

export const OBJECT_TRANSLATION_SCHEMA = {
    nameFieldLabel: 'string',
    gender: 'string',
    startsWith: 'string',
} as const;

/**
 * オブジェクトの翻訳。<オブジェクト>-<言語>.objectTranslation-meta.xml と、同じフォルダの項目の翻訳を 1 つにまとめたもの。
 * 子は、ファイルにも objectTranslation-meta.xml の中にもなければ持たない
 */
export type CustomObjectTranslationJson = JsonType<'objectTranslation'> & {
    objectApiName: string;
    locale: string;
    fields?: (CustomFieldTranslationJson | ErrorJson)[];
    caseValues?: CaseValueJson[];
} & { [K in TranslationMemberKey]?: TranslationMemberJson<K>[] } & PropertiesOf<
        typeof OBJECT_TRANSLATION_SCHEMA
    >;

export type ObjectTranslationSource = {
    /** フォルダ名 (<オブジェクト>-<言語>) */
    name: string;
    /** <オブジェクト>-<言語>.objectTranslation-meta.xml (ないこともある) */
    objectFile?: ParsedXmlFile;
    /** 項目の翻訳のファイル (ファイル名の順) */
    fieldFiles: ParsedXmlFile[];
};

/** オブジェクトの翻訳のフォルダから読んだファイルを、CustomObjectTranslationJson にする */
export const makeCustomObjectTranslationJson = (
    source: ObjectTranslationSource,
    registry: XmlSourceRegistry,
): { translation: CustomObjectTranslationJson; problems: XmlReadProblem[] } => {
    const problems: XmlReadProblem[] = [];
    const { objectApiName, locale } = splitTranslationName(source.name);

    const objectFile: XmlFile = source.objectFile ?? {
        filePath: `${source.name}/${source.name}${OBJECT_TRANSLATION_SUFFIX}`,
        source: '',
    };
    const objectRoot = source.objectFile
        ? readXmlRoot(
              source.objectFile,
              'CustomObjectTranslation',
              'objectTranslation',
              registry,
              problems,
          )
        : undefined;
    const objectElement = objectRoot && 'name' in objectRoot ? objectRoot : undefined;

    // 項目: object-meta.xml の中のもの (メタデータ API の形式) のあとに、ファイル名の順
    const fields = [
        ...(objectElement
            ? childrenOf(objectElement, 'fields').map((element) =>
                  makeCustomFieldTranslationJson(element, '', objectFile, registry),
              )
            : []),
        ...source.fieldFiles.map((file) => {
            const root = readXmlRoot(
                file,
                'CustomFieldTranslation',
                'fieldTranslation',
                registry,
                problems,
            );
            return 'children' in root
                ? makeCustomFieldTranslationJson(root, file.name, file, registry)
                : root;
        }),
    ];

    const members = Object.fromEntries(
        (Object.keys(TRANSLATION_MEMBERS) as TranslationMemberKey[]).flatMap((key) => {
            const items = objectElement
                ? childrenOf(objectElement, TRANSLATION_MEMBERS[key].element).map((element) =>
                      makeTranslationMemberJson(key, element, objectFile, registry),
                  )
                : [];
            return items.length === 0 ? [] : [[key, items] as const];
        }),
    );

    const caseValues = objectElement
        ? childrenOf(objectElement, 'caseValues').map((element) =>
              readProperties(element, {
                  value: 'string',
                  plural: 'boolean',
                  caseType: 'string',
                  possessive: 'string',
                  article: 'string',
              }),
          )
        : [];

    const translation = makeXmlJson<CustomObjectTranslationJson>(
        'objectTranslation',
        {
            objectApiName,
            locale,
            ...readProperties(objectElement, OBJECT_TRANSLATION_SCHEMA),
            ...nonEmptyEntry('fields', fields),
            ...nonEmptyEntry('caseValues', caseValues),
            ...members,
        } as Omit<CustomObjectTranslationJson, 'kind' | 'sourceKeys'>,
        objectElement,
        objectFile,
        registry,
    );

    return { translation, problems };
};
