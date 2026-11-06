import type { ErrorJson, JsonType } from '../commons/json';
import { childrenOf, type XmlElement } from '../commons/xml';
import {
    makeMetadataJson,
    nonEmptyEntry,
    readProperties,
    readText,
    readTexts,
    readXmlRoot,
    unknownChildNames,
    type ParsedXmlFile,
    type PropertiesOf,
    type XmlFile,
    type XmlReadProblem,
    type XmlSourceRegistry,
} from '../commons/xmlJson';

// ページレイアウト (layouts/<オブジェクト>-<名前>.layout-meta.xml) の JSON。方針: docs/metadata-a-plan.md 7 章
// セクション・列を入れ子にせず、項目は位置 (セクション・列・行) 付きの平らな並びにする
// (項目を別のセクションに動かしたとき、削除 + 追加ではなく位置の変更として出すため)

export const LAYOUT_SCHEMA = {
    emailDefault: 'boolean',
    runAssignmentRulesDefault: 'boolean',
    showEmailCheckbox: 'boolean',
    showHighlightsPanel: 'boolean',
    showInteractionLogPanel: 'boolean',
    showKnowledgeComponent: 'boolean',
    showRunAssignmentRulesCheckbox: 'boolean',
    showSolutionSection: 'boolean',
    showSubmitAndAttachButton: 'boolean',
} as const;

export const LAYOUT_SECTION_SCHEMA = {
    label: 'string',
    style: 'string',
    customLabel: 'boolean',
    detailHeading: 'boolean',
    editHeading: 'boolean',
} as const;

export const LAYOUT_ITEM_SCHEMA = {
    field: 'string',
    customLink: 'string',
    page: 'string',
    canvas: 'string',
    component: 'string',
    reportChartComponent: 'string',
    analyticsCloudComponent: 'string',
    emptySpace: 'boolean',
    behavior: 'string',
    height: 'number',
    width: 'string',
    showLabel: 'boolean',
    showScrollbars: 'boolean',
} as const;

export const LAYOUT_RELATED_LIST_SCHEMA = {
    relatedList: 'string',
    sortField: 'string',
    sortOrder: 'string',
    customButtons: 'string',
} as const;

/** セクション (表示順に並ぶ) */
export type LayoutSectionJson = JsonType<'layoutSection'> &
    PropertiesOf<typeof LAYOUT_SECTION_SCHEMA> & {
        /** 列の数 */
        columns: number;
    };

/** 項目の位置。section はセクションのラベル (ラベルがなければ番号)、column・row は 1 始まり */
export type LayoutItemPosition = { section: string; column: number; row: number };

/** 項目 (項目・リンク・Visualforce・空白など) */
export type LayoutItemJson = JsonType<'layoutItem'> &
    PropertiesOf<typeof LAYOUT_ITEM_SCHEMA> & {
        position: LayoutItemPosition;
    };

export type LayoutRelatedListJson = JsonType<'layoutRelatedList'> & {
    relatedList: string;
    /** 表示する項目 (表示順) */
    fields?: string[];
    buttons?: string[];
    excludeButtons?: string[];
    customButtonNames?: string[];
} & Omit<PropertiesOf<typeof LAYOUT_RELATED_LIST_SCHEMA>, 'customButtons' | 'relatedList'>;

/** ボタン・アクション (platformActionList の項目)。sortOrder の順 */
export type LayoutActionJson = JsonType<'layoutAction'> & {
    actionName: string;
    actionType?: string;
    sortOrder?: number;
    /** actionListContext (Record など) */
    context?: string;
};

export type LayoutJson = JsonType<'layout'> & {
    /** ファイル名から接尾辞を除いたもの (<オブジェクト>-<名前>) */
    name: string;
    /** ファイル名の最初の - までのオブジェクトの API 名 */
    objectApiName: string;
    sections?: LayoutSectionJson[];
    items?: LayoutItemJson[];
    relatedLists?: LayoutRelatedListJson[];
    actions?: LayoutActionJson[];
    /** quickActionList の quickActionName (表示順) */
    quickActions?: string[];
    excludeButtons?: string[];
    customButtons?: string[];
    skippedElements?: string[];
} & PropertiesOf<typeof LAYOUT_SCHEMA>;

/** 項目のキー (Diff で対応付ける)。空白はキーを持たない */
export const layoutItemKey = (item: LayoutItemJson): string | undefined =>
    item.field ??
    item.customLink ??
    item.page ??
    item.canvas ??
    item.component ??
    item.reportChartComponent ??
    item.analyticsCloudComponent;

const makeItems = (
    section: XmlElement,
    sectionName: string,
    file: XmlFile,
    registry: XmlSourceRegistry,
): LayoutItemJson[] =>
    childrenOf(section, 'layoutColumns').flatMap((column, columnIndex) =>
        childrenOf(column, 'layoutItems').map((item, rowIndex) =>
            makeMetadataJson<LayoutItemJson>(
                'layoutItem',
                {
                    ...readProperties(item, LAYOUT_ITEM_SCHEMA),
                    position: { section: sectionName, column: columnIndex + 1, row: rowIndex + 1 },
                },
                item,
                file,
                registry,
            ),
        ),
    );

export const makeLayoutJson = (
    file: ParsedXmlFile,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
): LayoutJson | ErrorJson => {
    const root = readXmlRoot(file, 'Layout', 'layout', registry, problems);
    if (!('name' in root)) return root;

    const sectionElements = childrenOf(root, 'layoutSections');
    const sections = sectionElements.map((section) =>
        makeMetadataJson<LayoutSectionJson>(
            'layoutSection',
            {
                ...readProperties(section, LAYOUT_SECTION_SCHEMA),
                columns: childrenOf(section, 'layoutColumns').length,
            },
            section,
            file,
            registry,
        ),
    );
    const items = sectionElements.flatMap((section, index) =>
        makeItems(section, readText(section, 'label') ?? `#${index + 1}`, file, registry),
    );
    const relatedLists = childrenOf(root, 'relatedLists').map((list) => {
        const { customButtons: _customButtons, ...properties } = readProperties(
            list,
            LAYOUT_RELATED_LIST_SCHEMA,
        );
        return makeMetadataJson<LayoutRelatedListJson>(
            'layoutRelatedList',
            {
                ...properties,
                relatedList: readText(list, 'relatedList') ?? '',
                ...nonEmptyEntry('fields', readTexts(list, 'fields')),
                ...nonEmptyEntry('buttons', readTexts(list, 'buttons')),
                ...nonEmptyEntry('excludeButtons', readTexts(list, 'excludeButtons')),
                ...nonEmptyEntry('customButtonNames', readTexts(list, 'customButtons')),
            },
            list,
            file,
            registry,
        );
    });
    const actions = childrenOf(root, 'platformActionList').flatMap((list) => {
        const context = readText(list, 'actionListContext');
        return childrenOf(list, 'platformActionListItems').map((item) => {
            const sortOrder = readText(item, 'sortOrder');
            const actionType = readText(item, 'actionType');
            return makeMetadataJson<LayoutActionJson>(
                'layoutAction',
                {
                    actionName: readText(item, 'actionName') ?? '',
                    ...(actionType !== undefined ? { actionType } : {}),
                    ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
                    ...(context !== undefined ? { context } : {}),
                },
                item,
                file,
                registry,
            );
        });
    });
    const quickActions = childrenOf(root, 'quickActionList').flatMap((list) =>
        childrenOf(list, 'quickActionListItems').flatMap((item) => {
            const name = readText(item, 'quickActionName');
            return name ? [name] : [];
        }),
    );

    return makeMetadataJson<LayoutJson>(
        'layout',
        {
            name: file.name,
            objectApiName: file.name.split('-')[0]!,
            ...readProperties(root, LAYOUT_SCHEMA),
            ...nonEmptyEntry('sections', sections),
            ...nonEmptyEntry('items', items),
            ...nonEmptyEntry('relatedLists', relatedLists),
            ...nonEmptyEntry('actions', actions),
            ...nonEmptyEntry('quickActions', quickActions),
            ...nonEmptyEntry('excludeButtons', readTexts(root, 'excludeButtons')),
            ...nonEmptyEntry('customButtons', readTexts(root, 'customButtons')),
            ...nonEmptyEntry(
                'skippedElements',
                unknownChildNames(root, [
                    ...Object.keys(LAYOUT_SCHEMA),
                    'layoutSections',
                    'relatedLists',
                    'platformActionList',
                    'quickActionList',
                    'excludeButtons',
                    'customButtons',
                ]),
            ),
        },
        root,
        file,
        registry,
    );
};
