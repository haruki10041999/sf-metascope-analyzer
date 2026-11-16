import { JsonType } from '../commons/json';

import {
    XmlFile,
    XmlSourceRegistry,
    PropertiesOf,
    makeXmlJson,
    nonEmptyEntry,
    readProperties,
    readText,
    unknownChildNames,
} from '../commons/xmlJson';
import { XmlElement, childrenOf } from '../commons/xml';

export const RECORD_TYPE_SCHEMA = {
    label: 'string',
    active: 'boolean',
    description: 'string',
    businessProcess: 'string',
    compactLayoutAssignment: 'string',
} as const;

/**
 * レコードタイプ・ビジネスプロセスで使える選択リスト値 1 つ (`<values>`)。
 * 段階 M8 で kind と位置を付けた (以前は kind のない値。docs/metadata-json-review.md 2.3 の選択リスト値)
 */
export type PicklistValueSelectionJson = JsonType<'picklistValueSelection'> & {
    fullName: string;
    default?: boolean;
};

/** 子要素 values (使える選択リスト値) を読む */
export const readPicklistValueSelections = (
    element: XmlElement,
    file: XmlFile,
    registry: XmlSourceRegistry,
): PicklistValueSelectionJson[] =>
    childrenOf(element, 'values').map((value) =>
        makeXmlJson<PicklistValueSelectionJson>(
            'picklistValueSelection',
            {
                fullName: readText(value, 'fullName') ?? '',
                ...readProperties(value, { default: 'boolean' }),
            },
            value,
            file,
            registry,
        ),
    );

/** レコードタイプで使える選択リスト値 (`<picklistValues>`)。picklist は項目の API 名 */
export type RecordTypePicklistJson = JsonType<'recordTypePicklist'> & {
    picklist: string;
    values?: PicklistValueSelectionJson[];
};

/** レコードタイプ (recordTypes/*.recordType-meta.xml) */
export type RecordTypeJson = JsonType<'recordType'> & {
    /** 読んでいない要素の名前 */
    skippedElements?: string[];
    fullName: string;
    picklistValues?: RecordTypePicklistJson[];
} & PropertiesOf<typeof RECORD_TYPE_SCHEMA>;

const makeRecordTypePicklistJson = (
    element: XmlElement,
    file: XmlFile,
    registry: XmlSourceRegistry,
): RecordTypePicklistJson =>
    makeXmlJson<RecordTypePicklistJson>(
        'recordTypePicklist',
        {
            picklist: readText(element, 'picklist') ?? '',
            ...nonEmptyEntry('values', readPicklistValueSelections(element, file, registry)),
        },
        element,
        file,
        registry,
    );

export const makeRecordTypeJson = (
    element: XmlElement,
    fullName: string,
    file: XmlFile,
    registry: XmlSourceRegistry,
): RecordTypeJson =>
    makeXmlJson<RecordTypeJson>(
        'recordType',
        {
            fullName: readText(element, 'fullName') ?? fullName,
            ...readProperties(element, RECORD_TYPE_SCHEMA),
            ...nonEmptyEntry(
                'picklistValues',
                childrenOf(element, 'picklistValues').map((picklist) =>
                    makeRecordTypePicklistJson(picklist, file, registry),
                ),
            ),
            ...nonEmptyEntry(
                'skippedElements',
                unknownChildNames(element, [
                    'fullName',
                    ...Object.keys(RECORD_TYPE_SCHEMA),
                    'picklistValues',
                ]),
            ),
        },
        element,
        file,
        registry,
    );
