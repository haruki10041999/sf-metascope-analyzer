import { type SchemaChildJson, schemaChildJsonOf } from '../commons/xmlJson';

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
export type WebLinkJson = SchemaChildJson<'webLink', typeof WEB_LINK_SCHEMA>;

export const makeWebLinkJson = schemaChildJsonOf('webLink', WEB_LINK_SCHEMA);
