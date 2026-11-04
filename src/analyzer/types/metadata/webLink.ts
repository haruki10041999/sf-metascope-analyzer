import { JsonType } from '../commons/json';

import {
    XmlFile,
    XmlSourceRegistry,
    PropertiesOf,
    makeXmlJson,
    readProperties,
    readText,
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
    url: 'string',
} as const;

/** カスタムボタン・リンク (webLinks/*.webLink-meta.xml) */
export type WebLinkJson = JsonType<'webLink'> & {
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
            ...readProperties(element, WEB_LINK_SCHEMA),
        },
        element,
        file,
        registry,
    );
