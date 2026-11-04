import { ErrorJson, JsonType } from '../commons/json';

import {
    XmlFile,
    XmlSourceRegistry,
    PropertiesOf,
    makeXmlJson,
    nonEmptyEntry,
    readProperties,
    readText,
} from '../commons/xmlJson';
import { XmlElement, childOf, childrenOf } from '../commons/xml';

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
export type ValueSetJson = {
    restricted?: boolean;
    sorted?: boolean;
    valueSetName?: string;
    controllingField?: string;
    values?: (PicklistValueJson | ErrorJson)[];
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
    defaultValue: 'string',
    formula: 'string',
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

export type CustomFieldJson = JsonType<'field'> & {
    apiName: string;
    valueSet?: ValueSetJson;
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
    return {
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
    };
};

/**
 * 項目。element は `<CustomField>` (sfdx の fields/*.field-meta.xml) か、
 * `<CustomObject>` の中の `<fields>` (メタデータ API の形式)。apiName は fullName がなければファイル名から
 */
export const makeCustomFieldJson = (
    element: XmlElement,
    apiName: string,
    file: XmlFile,
    registry: XmlSourceRegistry,
): CustomFieldJson => {
    const valueSet = childOf(element, 'valueSet');
    return makeXmlJson<CustomFieldJson>(
        'field',
        {
            apiName: readText(element, 'fullName') ?? apiName,
            ...readProperties(element, FIELD_SCHEMA),
            ...(valueSet ? { valueSet: makeValueSetJson(valueSet, file, registry) } : {}),
        },
        element,
        file,
        registry,
    );
};
