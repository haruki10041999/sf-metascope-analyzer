// 基本コンポーネント (lightning-*) のカタログ (docs/lwc-implementation.md)。
// 基本コンポーネントのソースはリポジトリにないので、解析に要る情報だけを手で持つ。
// npm の lightning-base-components からは作らない (alpha の版しかない・利用規約・レコードフォーム系が含まれない)。
// 各部品の @api の全部は持たない (プロパティ名の書き間違いの検出が要るようになったら足す)

/** メタデータを参照する属性が、何を参照するか */
export type LwcMetadataRefType = 'object' | 'field' | 'recordType' | 'listView' | 'flow' | 'icon';

export type LightningComponentSpec = {
    /** Salesforce のデータを読み書きする部品 (レコードフォーム・ファイルのアップロードなど) */
    dataAccess?: boolean;
    /** メタデータを参照する属性 (属性名 → 参照するもの)。field は祖先のレコードフォームのオブジェクトの項目 */
    metadataAttributes?: Readonly<Record<string, LwcMetadataRefType>>;
    /** 子の lightning-input-field / lightning-output-field の field-name の、オブジェクトを決める部品 (レコードフォーム) */
    providesObject?: boolean;
};

const RECORD_FORM: LightningComponentSpec = {
    dataAccess: true,
    providesObject: true,
    metadataAttributes: {
        'object-api-name': 'object',
        fields: 'field',
        'record-type-id': 'recordType',
    },
};

const FIELD: LightningComponentSpec = {
    dataAccess: true,
    metadataAttributes: { 'field-name': 'field' },
};

/** タグ名 → 仕様。ここにないタグは、存在しない (書き間違い) か、カタログが古い */
export const LIGHTNING_COMPONENTS: Readonly<Record<string, LightningComponentSpec>> = {
    'lightning-accordion': {},
    'lightning-accordion-section': {},
    'lightning-avatar': {},
    'lightning-badge': {},
    'lightning-breadcrumb': {},
    'lightning-breadcrumbs': {},
    'lightning-button': {},
    'lightning-button-group': {},
    'lightning-button-icon': {},
    'lightning-button-icon-stateful': {},
    'lightning-button-menu': {},
    'lightning-button-stateful': {},
    'lightning-card': {},
    'lightning-carousel': {},
    'lightning-carousel-image': {},
    'lightning-checkbox-group': {},
    'lightning-click-to-dial': {},
    'lightning-combobox': {},
    'lightning-datatable': {},
    'lightning-dual-listbox': {},
    'lightning-dynamic-icon': {},
    'lightning-file-upload': { dataAccess: true },
    'lightning-flow': { metadataAttributes: { 'flow-api-name': 'flow' } },
    'lightning-formatted-address': {},
    'lightning-formatted-date-time': {},
    'lightning-formatted-email': {},
    'lightning-formatted-location': {},
    'lightning-formatted-name': {},
    'lightning-formatted-number': {},
    'lightning-formatted-phone': {},
    'lightning-formatted-rich-text': {},
    'lightning-formatted-text': {},
    'lightning-formatted-time': {},
    'lightning-formatted-url': {},
    'lightning-helptext': {},
    'lightning-icon': {},
    'lightning-input': {},
    'lightning-input-address': {},
    'lightning-input-field': FIELD,
    'lightning-input-location': {},
    'lightning-input-name': {},
    'lightning-input-rich-text': {},
    'lightning-layout': {},
    'lightning-layout-item': {},
    'lightning-list-view': {
        dataAccess: true,
        metadataAttributes: { 'object-api-name': 'object', 'list-view-api-name': 'listView' },
    },
    'lightning-map': {},
    'lightning-menu-divider': {},
    'lightning-menu-item': {},
    'lightning-menu-subheader': {},
    'lightning-messages': {},
    'lightning-modal-body': {},
    'lightning-modal-footer': {},
    'lightning-modal-header': {},
    'lightning-output-field': FIELD,
    'lightning-pill': {},
    'lightning-pill-container': {},
    'lightning-progress-bar': {},
    'lightning-progress-indicator': {},
    'lightning-progress-ring': {},
    'lightning-progress-step': {},
    'lightning-quick-action-panel': {},
    'lightning-radio-group': {},
    'lightning-record-edit-form': RECORD_FORM,
    'lightning-record-form': RECORD_FORM,
    'lightning-record-picker': {
        dataAccess: true,
        metadataAttributes: { 'object-api-name': 'object' },
    },
    'lightning-record-view-form': RECORD_FORM,
    'lightning-relative-date-time': {},
    'lightning-slider': {},
    'lightning-spinner': {},
    'lightning-tab': {},
    'lightning-tabset': {},
    'lightning-textarea': {},
    'lightning-tile': {},
    'lightning-tree': {},
    'lightning-tree-grid': {},
    'lightning-vertical-navigation': {},
    'lightning-vertical-navigation-item': {},
    'lightning-vertical-navigation-item-badge': {},
    'lightning-vertical-navigation-item-icon': {},
    'lightning-vertical-navigation-overflow': {},
    'lightning-vertical-navigation-section': {},
};

/** どの lightning-* でも SLDS のアイコンを参照する属性 */
export const LIGHTNING_ICON_ATTRIBUTES: readonly string[] = [
    'icon-name',
    'fallback-icon-name',
    'prefix-icon-name',
];

export const getLightningComponentSpec = (tag: string): LightningComponentSpec | undefined =>
    LIGHTNING_COMPONENTS[tag];

/** lightning-* の属性が参照するメタデータ (なければ undefined) */
export const getLightningMetadataRef = (
    tag: string,
    attribute: string,
): LwcMetadataRefType | undefined => {
    if (!tag.startsWith('lightning-')) return undefined;
    const ref = LIGHTNING_COMPONENTS[tag]?.metadataAttributes?.[attribute];
    if (ref) return ref;
    return LIGHTNING_ICON_ATTRIBUTES.includes(attribute) ? 'icon' : undefined;
};
