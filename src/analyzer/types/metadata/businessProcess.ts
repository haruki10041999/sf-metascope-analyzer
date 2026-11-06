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

// オブジェクトの子のうち、ビジネスプロセスと共有の理由。方針: docs/metadata-implementation.md

export const BUSINESS_PROCESS_SCHEMA = {
    description: 'string',
    isActive: 'boolean',
} as const;

/** ビジネスプロセスで使える選択リスト値 (商談のフェーズ・ケースの状況など) */
export type BusinessProcessValue = { fullName: string; default?: boolean };

/** ビジネスプロセス (businessProcesses/*.businessProcess-meta.xml) */
export type BusinessProcessJson = JsonType<'businessProcess'> & {
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

export const SHARING_REASON_SCHEMA = {
    label: 'string',
} as const;

/** 共有の理由 (sharingReasons/*.sharingReason-meta.xml。Apex の共有で使う) */
export type SharingReasonJson = JsonType<'sharingReason'> & {
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
        },
        element,
        file,
        registry,
    );
