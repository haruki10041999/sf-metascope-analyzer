import { JsonType } from '../commons/json';

import {
    XmlFile,
    XmlSourceRegistry,
    PropertiesOf,
    makeXmlJson,
    nonEmptyEntry,
    readProperties,
    readText,
} from '../commons/xmlJson';
import { XmlElement, childrenOf } from '../commons/xml';

export const RECORD_TYPE_SCHEMA = {
    label: 'string',
    active: 'boolean',
    description: 'string',
    businessProcess: 'string',
    compactLayoutAssignment: 'string',
} as const;

/** レコードタイプで使える選択リスト値 (`<picklistValues>`)。picklist は項目の API 名 */
export type RecordTypePicklistJson = JsonType<'recordTypePicklist'> & {
    picklist: string;
    values?: { fullName: string; default?: boolean }[];
};

/** レコードタイプ (recordTypes/*.recordType-meta.xml) */
export type RecordTypeJson = JsonType<'recordType'> & {
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
            ...nonEmptyEntry(
                'values',
                childrenOf(element, 'values').map((value) => ({
                    fullName: readText(value, 'fullName') ?? '',
                    ...readProperties(value, { default: 'boolean' }),
                })),
            ),
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
        },
        element,
        file,
        registry,
    );
