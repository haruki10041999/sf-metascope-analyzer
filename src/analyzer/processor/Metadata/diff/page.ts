import {
    ErrorJson,
    FLEXI_PAGE_SCHEMA,
    FlexiPageComponentJson,
    FlexiPageFieldJson,
    FlexiPageJson,
    FlexiPageRegionJson,
    FlexiPageVisibilityRule,
    LAYOUT_ITEM_SCHEMA,
    LAYOUT_SCHEMA,
    LAYOUT_SECTION_SCHEMA,
    LayoutActionJson,
    LayoutItemJson,
    LayoutItemPosition,
    LayoutJson,
    LayoutRelatedListJson,
    LayoutSectionJson,
    layoutItemKey,
} from '../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    makeKeyedDiff,
    makeNodeDiff,
    makeSequenceDiff,
    makeValueDiff,
} from '../../commons/diff/commons';
import { TypedListDiff } from '../../commons/diff/list';
import {
    PresentDiff,
    PropertiesDiff,
    makeOrderedNamesDiff,
    makePresentDiff,
    makePropertiesDiff,
    makeUnorderedValuesDiff,
    presentEntry,
} from '../../commons/diff/present';

// 画面 (ページレイアウト・Lightning ページ) の差分。方針: docs/metadata-implementation.md 10 章

type Values = PresentDiff<string[], TypedListDiff<string, ValueDiff<string>>>;
type ValueSet = PresentDiff<string[], TypedListDiff<string, never>>;

const orderedEntry = <K extends string>(key: K, before?: string[], after?: string[]) =>
    presentEntry(key, makePresentDiff(before, after, makeOrderedNamesDiff));
const setEntry = <K extends string>(key: K, before?: string[], after?: string[]) =>
    presentEntry(key, makePresentDiff(before, after, makeUnorderedValuesDiff));
const optionalEntry = <K extends string, T>(key: K, before?: T, after?: T) =>
    presentEntry(key, makePresentDiff(before, after, makeValueDiff));

// ---------------------------------------------------------------------------
// ページレイアウト
// ---------------------------------------------------------------------------

export type LayoutSectionJsonDiff = NodeDiff<
    'layoutSection',
    LayoutSectionJson,
    { columns: ValueDiff<number> } & PropertiesDiff<typeof LAYOUT_SECTION_SCHEMA>
>;

export const makeLayoutSectionDiff = (
    before: LayoutSectionJson,
    after: LayoutSectionJson,
    match: Match = 'key',
): LayoutSectionJsonDiff =>
    makeNodeDiff('layoutSection', before, after, match, (b, a) => ({
        columns: makeValueDiff(b.columns, a.columns),
        ...makePropertiesDiff(LAYOUT_SECTION_SCHEMA, b, a),
    }));

export type LayoutItemJsonDiff = NodeDiff<
    'layoutItem',
    LayoutItemJson,
    { position: ValueDiff<LayoutItemPosition> } & PropertiesDiff<typeof LAYOUT_ITEM_SCHEMA>
>;

export const makeLayoutItemDiff = (
    before: LayoutItemJson,
    after: LayoutItemJson,
    match: Match = 'key',
): LayoutItemJsonDiff =>
    makeNodeDiff('layoutItem', before, after, match, (b, a) => ({
        position: makeValueDiff(b.position, a.position),
        ...makePropertiesDiff(LAYOUT_ITEM_SCHEMA, b, a),
    }));

export type LayoutRelatedListJsonDiff = NodeDiff<
    'layoutRelatedList',
    LayoutRelatedListJson,
    {
        relatedList: ValueDiff<string>;
        sortField?: PresentDiff<string, ValueDiff<string>>;
        sortOrder?: PresentDiff<string, ValueDiff<string>>;
        fields?: Values;
        buttons?: ValueSet;
        excludeButtons?: ValueSet;
        customButtonNames?: Values;
    }
>;

export const makeLayoutRelatedListDiff = (
    before: LayoutRelatedListJson,
    after: LayoutRelatedListJson,
    match: Match = 'key',
): LayoutRelatedListJsonDiff =>
    makeNodeDiff('layoutRelatedList', before, after, match, (b, a) => ({
        relatedList: makeValueDiff(b.relatedList, a.relatedList),
        ...optionalEntry('sortField', b.sortField, a.sortField),
        ...optionalEntry('sortOrder', b.sortOrder, a.sortOrder),
        ...orderedEntry('fields', b.fields, a.fields),
        ...setEntry('buttons', b.buttons, a.buttons),
        ...setEntry('excludeButtons', b.excludeButtons, a.excludeButtons),
        ...orderedEntry('customButtonNames', b.customButtonNames, a.customButtonNames),
    }));

export type LayoutActionJsonDiff = NodeDiff<
    'layoutAction',
    LayoutActionJson,
    {
        actionName: ValueDiff<string>;
        actionType?: PresentDiff<string, ValueDiff<string>>;
        sortOrder?: PresentDiff<number, ValueDiff<number>>;
        context?: PresentDiff<string, ValueDiff<string>>;
    }
>;

export const makeLayoutActionDiff = (
    before: LayoutActionJson,
    after: LayoutActionJson,
    match: Match = 'key',
): LayoutActionJsonDiff =>
    makeNodeDiff('layoutAction', before, after, match, (b, a) => ({
        actionName: makeValueDiff(b.actionName, a.actionName),
        ...optionalEntry('actionType', b.actionType, a.actionType),
        ...optionalEntry('sortOrder', b.sortOrder, a.sortOrder),
        ...optionalEntry('context', b.context, a.context),
    }));

export type LayoutJsonDiff = NodeDiff<
    'layout',
    LayoutJson,
    {
        name: ValueDiff<string>;
        objectApiName: ValueDiff<string>;
        /** C. 表示順 (label で組にする) */
        sections?: PresentDiff<
            LayoutSectionJson[],
            ListItemDiff<'layoutSection', LayoutSectionJson, LayoutSectionJsonDiff>[]
        >;
        /** D. 項目の API 名など (空白は集合) */
        items?: PresentDiff<
            LayoutItemJson[],
            ListItemDiff<'layoutItem', LayoutItemJson, LayoutItemJsonDiff>[]
        >;
        /** C. 表示順 (relatedList で組にする) */
        relatedLists?: PresentDiff<
            LayoutRelatedListJson[],
            ListItemDiff<'layoutRelatedList', LayoutRelatedListJson, LayoutRelatedListJsonDiff>[]
        >;
        /** D. <context>:<actionName> (順序は sortOrder の値の変更として出る) */
        actions?: PresentDiff<
            LayoutActionJson[],
            ListItemDiff<'layoutAction', LayoutActionJson, LayoutActionJsonDiff>[]
        >;
        quickActions?: Values;
        excludeButtons?: ValueSet;
        customButtons?: Values;
        skippedElements?: ValueSet;
    } & PropertiesDiff<typeof LAYOUT_SCHEMA>
>;

export const makeLayoutDiff = (
    before: LayoutJson | ErrorJson,
    after: LayoutJson | ErrorJson,
    match: Match = 'key',
    sources?: Sources,
): LayoutJsonDiff =>
    makeNodeDiff('layout', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        objectApiName: makeValueDiff(b.objectApiName, a.objectApiName),
        ...makePropertiesDiff(LAYOUT_SCHEMA, b, a),
        ...presentEntry(
            'sections',
            makePresentDiff(b.sections, a.sections, (bs, as) =>
                makeSequenceDiff('layoutSection', bs, as, makeLayoutSectionDiff, {
                    sources,
                    canPair: (x, y) => x.label === y.label,
                }),
            ),
        ),
        ...presentEntry(
            'items',
            makePresentDiff(b.items, a.items, (bi, ai) =>
                makeKeyedDiff('layoutItem', bi, ai, makeLayoutItemDiff, layoutItemKey, sources),
            ),
        ),
        ...presentEntry(
            'relatedLists',
            makePresentDiff(b.relatedLists, a.relatedLists, (br, ar) =>
                makeSequenceDiff('layoutRelatedList', br, ar, makeLayoutRelatedListDiff, {
                    sources,
                    canPair: (x, y) => x.relatedList === y.relatedList,
                }),
            ),
        ),
        ...presentEntry(
            'actions',
            makePresentDiff(b.actions, a.actions, (ba, aa) =>
                makeKeyedDiff(
                    'layoutAction',
                    ba,
                    aa,
                    makeLayoutActionDiff,
                    (action) => `${action.context ?? ''}:${action.actionName}`,
                    sources,
                ),
            ),
        ),
        ...orderedEntry('quickActions', b.quickActions, a.quickActions),
        ...setEntry('excludeButtons', b.excludeButtons, a.excludeButtons),
        ...orderedEntry('customButtons', b.customButtons, a.customButtons),
        ...setEntry('skippedElements', b.skippedElements, a.skippedElements),
    }));

// ---------------------------------------------------------------------------
// Lightning ページ
// ---------------------------------------------------------------------------

/** 名前 → 値の差分 (名前ごと) */
export type NameValuesDiff = Record<string, PresentDiff<string, ValueDiff<string>>>;

export const makeNameValuesDiff = (
    before: Record<string, string> = {},
    after: Record<string, string> = {},
): NameValuesDiff =>
    Object.fromEntries(
        [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap((key) => {
            const diff = makePresentDiff(before[key], after[key], makeValueDiff);
            return diff === undefined ? [] : [[key, diff]];
        }),
    );

const nameValuesEntry = <K extends string>(
    key: K,
    before?: Record<string, string>,
    after?: Record<string, string>,
) =>
    before || after
        ? ({ [key]: makeNameValuesDiff(before, after) } as Record<K, NameValuesDiff>)
        : {};

export type FlexiPageRegionJsonDiff = NodeDiff<
    'flexiPageRegion',
    FlexiPageRegionJson,
    {
        name: ValueDiff<string>;
        regionType?: PresentDiff<string, ValueDiff<string>>;
        mode?: PresentDiff<string, ValueDiff<string>>;
        /** C. 中の部品・項目の表示順 (identifier。順序の変化は moved) */
        items?: Values;
    }
>;

export const makeFlexiPageRegionDiff = (
    before: FlexiPageRegionJson,
    after: FlexiPageRegionJson,
    match: Match = 'key',
): FlexiPageRegionJsonDiff =>
    makeNodeDiff('flexiPageRegion', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...optionalEntry('regionType', b.regionType, a.regionType),
        ...optionalEntry('mode', b.mode, a.mode),
        ...presentEntry('items', makePresentDiff(b.items, a.items, makeOrderedNamesDiff)),
    }));

type ItemFields = {
    identifier: ValueDiff<string>;
    region: ValueDiff<string>;
    properties?: NameValuesDiff;
    visibilityRule?: PresentDiff<FlexiPageVisibilityRule, ValueDiff<FlexiPageVisibilityRule>>;
};

export type FlexiPageComponentJsonDiff = NodeDiff<
    'flexiPageComponent',
    FlexiPageComponentJson,
    ItemFields & { componentName: ValueDiff<string> }
>;

export const makeFlexiPageComponentDiff = (
    before: FlexiPageComponentJson,
    after: FlexiPageComponentJson,
    match: Match = 'key',
): FlexiPageComponentJsonDiff =>
    makeNodeDiff('flexiPageComponent', before, after, match, (b, a) => ({
        identifier: makeValueDiff(b.identifier, a.identifier),
        componentName: makeValueDiff(b.componentName, a.componentName),
        region: makeValueDiff(b.region, a.region),
        ...nameValuesEntry('properties', b.properties, a.properties),
        ...optionalEntry('visibilityRule', b.visibilityRule, a.visibilityRule),
    }));

export type FlexiPageFieldJsonDiff = NodeDiff<
    'flexiPageField',
    FlexiPageFieldJson,
    ItemFields & { fieldItem: ValueDiff<string> }
>;

export const makeFlexiPageFieldDiff = (
    before: FlexiPageFieldJson,
    after: FlexiPageFieldJson,
    match: Match = 'key',
): FlexiPageFieldJsonDiff =>
    makeNodeDiff('flexiPageField', before, after, match, (b, a) => ({
        identifier: makeValueDiff(b.identifier, a.identifier),
        fieldItem: makeValueDiff(b.fieldItem, a.fieldItem),
        region: makeValueDiff(b.region, a.region),
        ...nameValuesEntry('properties', b.properties, a.properties),
        ...optionalEntry('visibilityRule', b.visibilityRule, a.visibilityRule),
    }));

export type FlexiPageJsonDiff = NodeDiff<
    'flexiPage',
    FlexiPageJson,
    {
        name: ValueDiff<string>;
        template?: PresentDiff<string, ValueDiff<string>>;
        templateProperties?: NameValuesDiff;
        regions?: PresentDiff<
            FlexiPageRegionJson[],
            ListItemDiff<'flexiPageRegion', FlexiPageRegionJson, FlexiPageRegionJsonDiff>[]
        >;
        components?: PresentDiff<
            FlexiPageComponentJson[],
            ListItemDiff<'flexiPageComponent', FlexiPageComponentJson, FlexiPageComponentJsonDiff>[]
        >;
        fields?: PresentDiff<
            FlexiPageFieldJson[],
            ListItemDiff<'flexiPageField', FlexiPageFieldJson, FlexiPageFieldJsonDiff>[]
        >;
        skippedElements?: ValueSet;
    } & PropertiesDiff<typeof FLEXI_PAGE_SCHEMA>
>;

export const makeFlexiPageDiff = (
    before: FlexiPageJson | ErrorJson,
    after: FlexiPageJson | ErrorJson,
    match: Match = 'key',
    sources?: Sources,
): FlexiPageJsonDiff =>
    makeNodeDiff('flexiPage', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...makePropertiesDiff(FLEXI_PAGE_SCHEMA, b, a),
        ...optionalEntry('template', b.template, a.template),
        ...nameValuesEntry('templateProperties', b.templateProperties, a.templateProperties),
        ...presentEntry(
            'regions',
            makePresentDiff(b.regions, a.regions, (br, ar) =>
                makeKeyedDiff(
                    'flexiPageRegion',
                    br,
                    ar,
                    makeFlexiPageRegionDiff,
                    (region) => region.name,
                    sources,
                ),
            ),
        ),
        ...presentEntry(
            'components',
            makePresentDiff(b.components, a.components, (bc, ac) =>
                makeKeyedDiff(
                    'flexiPageComponent',
                    bc,
                    ac,
                    makeFlexiPageComponentDiff,
                    (component) => component.identifier,
                    sources,
                ),
            ),
        ),
        ...presentEntry(
            'fields',
            makePresentDiff(b.fields, a.fields, (bf, af) =>
                makeKeyedDiff(
                    'flexiPageField',
                    bf,
                    af,
                    makeFlexiPageFieldDiff,
                    (field) => field.identifier,
                    sources,
                ),
            ),
        ),
        ...setEntry('skippedElements', b.skippedElements, a.skippedElements),
    }));
