import { JsonType } from '../commons/json';

import {
    XmlFile,
    XmlSourceRegistry,
    makeXmlJson,
    nonEmptyEntry,
    readProperties,
    readText,
    readTexts,
    unknownChildNames,
} from '../commons/xmlJson';
import { XmlElement } from '../commons/xml';

/** コンパクトレイアウト (compactLayouts/*.compactLayout-meta.xml)。fields は表示順 */
export type CompactLayoutJson = JsonType<'compactLayout'> & {
    /** 読んでいない要素の名前 */
    skippedElements?: string[];
    fullName: string;
    label?: string;
    fields?: string[];
};

export const makeCompactLayoutJson = (
    element: XmlElement,
    fullName: string,
    file: XmlFile,
    registry: XmlSourceRegistry,
): CompactLayoutJson =>
    makeXmlJson<CompactLayoutJson>(
        'compactLayout',
        {
            fullName: readText(element, 'fullName') ?? fullName,
            ...readProperties(element, { label: 'string' }),
            ...nonEmptyEntry('fields', readTexts(element, 'fields')),
            ...nonEmptyEntry(
                'skippedElements',
                unknownChildNames(element, ['fullName', 'label', 'fields']),
            ),
        },
        element,
        file,
        registry,
    );
