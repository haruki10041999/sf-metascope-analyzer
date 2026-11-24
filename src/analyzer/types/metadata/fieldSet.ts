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

export const FIELD_SET_SCHEMA = {
    label: 'string',
    description: 'string',
} as const;

/** 項目セットの項目 1 つ (metadata 8 からノード) */
export type FieldSetItemJson = JsonType<'fieldSetItem'> & {
    field: string;
    isFieldManaged?: boolean;
    isRequired?: boolean;
};

/** 項目セット (fieldSets/*.fieldSet-meta.xml)。displayedFields は表示順 */
export type FieldSetJson = JsonType<'fieldSet'> & {
    /** 読んでいない要素の名前 */
    skippedElements?: string[];
    fullName: string;
    displayedFields?: FieldSetItemJson[];
} & PropertiesOf<typeof FIELD_SET_SCHEMA>;

export const makeFieldSetJson = (
    element: XmlElement,
    fullName: string,
    file: XmlFile,
    registry: XmlSourceRegistry,
): FieldSetJson =>
    makeXmlJson<FieldSetJson>(
        'fieldSet',
        {
            fullName: readText(element, 'fullName') ?? fullName,
            ...readProperties(element, FIELD_SET_SCHEMA),
            ...nonEmptyEntry(
                'displayedFields',
                childrenOf(element, 'displayedFields').map((item) =>
                    makeXmlJson<FieldSetItemJson>(
                        'fieldSetItem',
                        {
                            field: readText(item, 'field') ?? '',
                            ...readProperties(item, {
                                isFieldManaged: 'boolean',
                                isRequired: 'boolean',
                            }),
                        },
                        item,
                        file,
                        registry,
                    ),
                ),
            ),
            ...nonEmptyEntry(
                'skippedElements',
                unknownChildNames(element, [
                    'fullName',
                    ...Object.keys(FIELD_SET_SCHEMA),
                    'displayedFields',
                ]),
            ),
        },
        element,
        file,
        registry,
    );
