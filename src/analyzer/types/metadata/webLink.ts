import { JsonType } from '../commons/json';

import {
    XmlFile,
    XmlSourceRegistry,
    PropertiesOf,
    makeXmlJson,
    readProperties,
    readText,
    nonEmptyEntry,
    unknownChildNames,
} from '../commons/xmlJson';
import { XmlElement } from '../commons/xml';

export const WEB_LINK_SCHEMA = {
    masterLabel: 'string',
    description: 'string',
    availability: 'string',
    displayType: 'string',
    linkType: 'string',
    openType: 'string',
    protected: 'boolean',
    /** URL (差し込みを含めば fxTemplate。段階 M6) */
    url: 'template',
    /** Visualforce のページ (linkType が page のとき) */
    page: 'string',
} as const;

/** カスタムボタン・リンク (webLinks/*.webLink-meta.xml) */
export type WebLinkJson = JsonType<'webLink'> & {
    /** 読んでいない要素の名前 */
    skippedElements?: string[];
    fullName: string;
} & PropertiesOf<typeof WEB_LINK_SCHEMA>;

export const makeWebLinkJson = (
    element: XmlElement,
    fullName: string,
    file: XmlFile,
    registry: XmlSourceRegistry,
): WebLinkJson =>
    makeXmlJson<WebLinkJson>(
        'webLink',
        {
            fullName: readText(element, 'fullName') ?? fullName,
            ...readProperties(element, WEB_LINK_SCHEMA, { file, registry }),
            ...nonEmptyEntry(
                'skippedElements',
                unknownChildNames(element, ['fullName', ...Object.keys(WEB_LINK_SCHEMA)]),
            ),
        },
        element,
        file,
        registry,
    );
