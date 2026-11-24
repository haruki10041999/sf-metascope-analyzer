import { JsonType } from '../commons/json';

import {
    XmlFile,
    XmlSourceRegistry,
    PropertiesOf,
    makeXmlJson,
    nonEmptyEntry,
    readProperties,
    unknownChildNames,
    readText,
} from '../commons/xmlJson';
import { XmlElement, childOf, childrenOf } from '../commons/xml';
import { CRITERIA_ITEM_NAMES, type CriterionJson, readCriteria } from './criteria';

/** 選択リスト値 (`<valueSetDefinition><value>`) */
export const PICKLIST_VALUE_SCHEMA = {
    label: 'string',
    default: 'boolean',
    color: 'string',
    isActive: 'boolean',
    description: 'string',
} as const;

export type PicklistValueJson = JsonType<'picklistValue'> & {
    fullName: string;
} & PropertiesOf<typeof PICKLIST_VALUE_SCHEMA>;

/** 選択リストの値の集合 (`<valueSet>`)。グローバル値セットを使うときは valueSetName だけを持つ */
export type ValueSetJson = JsonType<'valueSet'> & {
    restricted?: boolean;
    sorted?: boolean;
    valueSetName?: string;
    controllingField?: string;
    values?: PicklistValueJson[];
    /**
     * 依存する選択リストの対応表 (値 → その値を選べる制御項目の値)。段階 M3 で足した
     * (以前は valueSet の子なので skippedElements にも出ずに消えていた)
     */
    valueSettings?: PicklistValueSettingJson[];
};

/** 依存する選択リストの値 1 つと、その値を選べる制御項目の値 */
export type PicklistValueSettingJson = JsonType<'picklistValueSetting'> & {
    valueName: string;
    controllingFieldValues: string[];
};

export const FIELD_SCHEMA = {
    label: 'string',
    description: 'string',
    inlineHelpText: 'string',
    /** Salesforce の項目の型 (Text / Number / Lookup / Picklist / Checkbox …) をそのまま持つ */
    type: 'string',
    required: 'boolean',
    unique: 'boolean',
    externalId: 'boolean',
    caseSensitive: 'boolean',
    length: 'number',
    precision: 'number',
    scale: 'number',
    visibleLines: 'number',
    /** 既定値 (数式) */
    defaultValue: 'formula',
    formula: 'formula',
    formulaTreatBlanksAs: 'string',
    displayFormat: 'string',
    referenceTo: 'string',
    relationshipName: 'string',
    relationshipLabel: 'string',
    relationshipOrder: 'number',
    deleteConstraint: 'string',
    reparentableMasterDetail: 'boolean',
    writeRequiresMasterRead: 'boolean',
    summaryOperation: 'string',
    summarizedField: 'string',
    summaryForeignKey: 'string',
    trackHistory: 'boolean',
    trackTrending: 'boolean',
    trackFeedHistory: 'boolean',
} as const;

/** 参照項目の絞り込み条件 (`<lookupFilter>`) */
export const LOOKUP_FILTER_SCHEMA = {
    active: 'boolean',
    booleanFilter: 'filterLogic',
    description: 'string',
    errorMessage: 'string',
    infoMessage: 'string',
    isOptional: 'boolean',
} as const;

export type LookupFilterJson = JsonType<'lookupFilter'> &
    PropertiesOf<typeof LOOKUP_FILTER_SCHEMA> & {
        /** 条件の行 (書いた順。booleanFilter の番号が順序に依る) */
        filterItems: CriterionJson[];
    };

export type CustomFieldJson = JsonType<'field'> & {
    apiName: string;
    valueSet?: ValueSetJson;
    lookupFilter?: LookupFilterJson;
    /** 読んでいない要素の名前 (最初に出た順) */
    skippedElements?: string[];
} & PropertiesOf<typeof FIELD_SCHEMA>;

export const makePicklistValueJson = (
    element: XmlElement,
    file: XmlFile,
    registry: XmlSourceRegistry,
): PicklistValueJson =>
    makeXmlJson<PicklistValueJson>(
        'picklistValue',
        {
            fullName: readText(element, 'fullName') ?? '',
            ...readProperties(element, PICKLIST_VALUE_SCHEMA),
        },
        element,
        file,
        registry,
    );

const makeValueSetJson = (
    element: XmlElement,
    file: XmlFile,
    registry: XmlSourceRegistry,
): ValueSetJson => {
    const definition = childOf(element, 'valueSetDefinition');
    const restricted = readProperties(element, { restricted: 'boolean' }).restricted;
    const sorted = readProperties(definition, { sorted: 'boolean' }).sorted;
    const valueSetName = readText(element, 'valueSetName');
    const controllingField = readText(element, 'controllingField');
    return makeXmlJson<ValueSetJson>(
        'valueSet',
        {
            ...(restricted !== undefined ? { restricted } : {}),
            ...(sorted !== undefined ? { sorted } : {}),
            ...(valueSetName !== undefined ? { valueSetName } : {}),
            ...(controllingField !== undefined ? { controllingField } : {}),
            ...nonEmptyEntry(
                'values',
                definition
                    ? childrenOf(definition, 'value').map((value) =>
                          makePicklistValueJson(value, file, registry),
                      )
                    : [],
            ),
            ...nonEmptyEntry(
                'valueSettings',
                childrenOf(element, 'valueSettings').map((setting) =>
                    makeXmlJson<PicklistValueSettingJson>(
                        'picklistValueSetting',
                        {
                            valueName: readText(setting, 'valueName') ?? '',
                            controllingFieldValues: childrenOf(
                                setting,
                                'controllingFieldValue',
                            ).map((value) => value.text),
                        },
                        setting,
                        file,
                        registry,
                    ),
                ),
            ),
        },
        element,
        file,
        registry,
    );
};

/**
 * 項目。element は `<CustomField>` (sfdx の fields/*.field-meta.xml) か、
 * `<CustomObject>` の中の `<fields>` (メタデータ API の形式)。apiName は fullName がなければファイル名から
 */
/** 項目の要素のうち読むもの (これ以外は skippedElements に残す) */
const FIELD_KNOWN_ELEMENTS = ['fullName', ...Object.keys(FIELD_SCHEMA), 'valueSet', 'lookupFilter'];

export const makeCustomFieldJson = (
    element: XmlElement,
    apiName: string,
    file: XmlFile,
    registry: XmlSourceRegistry,
): CustomFieldJson => {
    const valueSet = childOf(element, 'valueSet');
    const lookupFilter = childOf(element, 'lookupFilter');
    return makeXmlJson<CustomFieldJson>(
        'field',
        {
            apiName: readText(element, 'fullName') ?? apiName,
            ...readProperties(element, FIELD_SCHEMA, { file, registry }),
            ...(valueSet ? { valueSet: makeValueSetJson(valueSet, file, registry) } : {}),
            // 要素がないときは持たない (保存済みのオブジェクトの objectKey を変えないため)
            ...(lookupFilter
                ? {
                      lookupFilter: makeXmlJson<LookupFilterJson>(
                          'lookupFilter',
                          {
                              ...readProperties(lookupFilter, LOOKUP_FILTER_SCHEMA, {
                                  file,
                                  registry,
                              }),
                              // 条件の行 (段階 M5 で criterion にした)
                              filterItems: readCriteria(
                                  lookupFilter,
                                  'filterItems',
                                  CRITERIA_ITEM_NAMES,
                                  { file, registry },
                              ),
                          },
                          lookupFilter,
                          file,
                          registry,
                      ),
                  }
                : {}),
            ...nonEmptyEntry('skippedElements', unknownChildNames(element, FIELD_KNOWN_ELEMENTS)),
        },
        element,
        file,
        registry,
    );
};
