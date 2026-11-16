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
import { XmlElement } from '../commons/xml';
import { type PicklistValueSelectionJson, readPicklistValueSelections } from './recordType';

// オブジェクトの子のうち、ビジネスプロセスと共有の理由。方針: docs/metadata-implementation.md

export const BUSINESS_PROCESS_SCHEMA = {
    description: 'string',
    isActive: 'boolean',
} as const;

/** ビジネスプロセスで使える選択リスト値 (商談のフェーズ・ケースの状況など) */
/** ビジネスプロセスで使える選択リスト値 (段階 M8 で kind と位置を持つ picklistValueSelection にした) */
export type BusinessProcessValue = PicklistValueSelectionJson;

/** ビジネスプロセス (businessProcesses/*.businessProcess-meta.xml) */
export type BusinessProcessJson = JsonType<'businessProcess'> & {
    /** 読んでいない要素の名前 */
    skippedElements?: string[];
    fullName: string;
    values?: BusinessProcessValue[];
} & PropertiesOf<typeof BUSINESS_PROCESS_SCHEMA>;

export const makeBusinessProcessJson = (
    element: XmlElement,
    fullName: string,
    file: XmlFile,
    registry: XmlSourceRegistry,
): BusinessProcessJson =>
    makeXmlJson<BusinessProcessJson>(
        'businessProcess',
        {
            fullName: readText(element, 'fullName') ?? fullName,
            ...readProperties(element, BUSINESS_PROCESS_SCHEMA),
            ...nonEmptyEntry('values', readPicklistValueSelections(element, file, registry)),
            ...nonEmptyEntry(
                'skippedElements',
                unknownChildNames(element, [
                    'fullName',
                    ...Object.keys(BUSINESS_PROCESS_SCHEMA),
                    'values',
                ]),
            ),
        },
        element,
        file,
        registry,
    );

export const SHARING_REASON_SCHEMA = {
    label: 'string',
} as const;

/** 共有の理由 (sharingReasons/*.sharingReason-meta.xml。Apex の共有で使う) */
export type SharingReasonJson = JsonType<'sharingReason'> & {
    /** 読んでいない要素の名前 */
    skippedElements?: string[];
    fullName: string;
} & PropertiesOf<typeof SHARING_REASON_SCHEMA>;

export const makeSharingReasonJson = (
    element: XmlElement,
    fullName: string,
    file: XmlFile,
    registry: XmlSourceRegistry,
): SharingReasonJson =>
    makeXmlJson<SharingReasonJson>(
        'sharingReason',
        {
            fullName: readText(element, 'fullName') ?? fullName,
            ...readProperties(element, SHARING_REASON_SCHEMA),
            ...nonEmptyEntry(
                'skippedElements',
                unknownChildNames(element, ['fullName', ...Object.keys(SHARING_REASON_SCHEMA)]),
            ),
        },
        element,
        file,
        registry,
    );
