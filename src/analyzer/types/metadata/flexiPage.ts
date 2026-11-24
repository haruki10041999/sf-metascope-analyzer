import type { JsonType } from '../commons/json';
import { childOf, childrenOf, type XmlElement } from '../commons/xml';
import {
    makeMetadataJson,
    nonEmptyEntry,
    readProperties,
    readText,
    readXmlRoot,
    unknownChildNames,
    type ParsedXmlFile,
    type PropertiesOf,
    type XmlFile,
    type XmlReadProblem,
    type XmlSourceRegistry,
} from '../commons/xmlJson';
import {
    type CriterionJson,
    type CriterionNames,
    type FilterLogicValue,
    readCriteria,
    readFilterLogic,
} from './criteria';

// Lightning ページ (flexipages/<名前>.flexipage-meta.xml) の JSON。方針: docs/metadata-implementation.md 10 章
// リージョン・部品・項目は平らな並びにし、部品・項目は置かれているリージョンの名前 (region) を持つ
// (リージョンをまたいで動かしたとき、削除 + 追加ではなく region の変更として出すため)。
// タブなどの部品の中 (Facet のリージョン) の入れ子は、表示のときに組み立てる

export const FLEXI_PAGE_SCHEMA = {
    masterLabel: 'string',
    description: 'string',
    type: 'string',
    sobjectType: 'string',
    parentFlexiPage: 'string',
    pageTemplate: 'string',
} as const;

/** 表示条件 (visibilityRule)。条件の行は leftValue・operator・rightValue を criterion にしたもの (段階 M5) */
/** 部品・項目の表示条件 (metadata 8 からノード。位置は visibilityRule の要素) */
export type FlexiPageVisibilityRule = JsonType<'flexiPageVisibilityRule'> & {
    booleanFilter?: FilterLogicValue;
    criteria: CriterionJson[];
};

const VISIBILITY_CRITERION_NAMES: CriterionNames = {
    left: 'leftValue',
    operator: 'operator',
    value: 'rightValue',
};

export type FlexiPageRegionJson = JsonType<'flexiPageRegion'> & {
    name: string;
    /** Region / Facet */
    regionType?: string;
    mode?: string;
    /** 中の部品・項目の identifier (表示順)。並び順の変化を出すため (部品・項目そのものは components / fields) */
    items?: string[];
};

/** 部品 (componentInstance)。componentName が c:<名前> なら LWC */
export type FlexiPageComponentJson = JsonType<'flexiPageComponent'> & {
    /** キー。ファイルにないときは <リージョン>:<componentName>:<リージョンの中の番号> */
    identifier: string;
    componentName: string;
    region: string;
    /** componentInstanceProperties (名前 → 値)。段階 M8 で properties から改名 (Flow・設定の properties は値の木で形が違う) */
    attributes?: Record<string, string>;
    /**
     * componentInstanceProperties のうち、値が並び (valueList) のもの (名前 → 値の並び)。
     * 動的な関連リストの項目など。段階 M3 で足した (以前は value だけを読み、並びは消えていた)
     */
    valueLists?: Record<string, string[]>;
    visibilityRule?: FlexiPageVisibilityRule;
};

/** 項目 (fieldInstance)。fieldItem は Record.<項目> */
export type FlexiPageFieldJson = JsonType<'flexiPageField'> & {
    identifier: string;
    fieldItem: string;
    region: string;
    /** fieldInstanceProperties (名前 → 値。段階 M8 で properties から改名) */
    attributes?: Record<string, string>;
    visibilityRule?: FlexiPageVisibilityRule;
};

export type FlexiPageJson = JsonType<'flexiPage'> & {
    name: string;
    /** template の name (flexipage:recordHomeTemplateDesktop など) */
    template?: string;
    /** template の properties (名前 → 値。段階 M8 で templateProperties から改名) */
    templateAttributes?: Record<string, string>;
    regions?: FlexiPageRegionJson[];
    components?: FlexiPageComponentJson[];
    fields?: FlexiPageFieldJson[];
    skippedElements?: string[];
} & PropertiesOf<typeof FLEXI_PAGE_SCHEMA>;

/** <name>…</name><value>…</value> の並びを、名前 → 値にする */
const readNameValues = (element: XmlElement, name: string): Record<string, string> =>
    Object.fromEntries(
        childrenOf(element, name).map((property) => [
            readText(property, 'name') ?? '',
            readText(property, 'value') ?? '',
        ]),
    );

const attributesEntry = (attributes: Record<string, string>) =>
    Object.keys(attributes).length ? { attributes } : {};

/** <name>…</name><valueList><valueListItems><value>…</value></valueListItems>…</valueList> の並び */
const readValueLists = (element: XmlElement, name: string): Record<string, string[]> =>
    Object.fromEntries(
        childrenOf(element, name).flatMap((property) => {
            const list = childOf(property, 'valueList');
            return list
                ? [
                      [
                          readText(property, 'name') ?? '',
                          childrenOf(list, 'valueListItems').map(
                              (item) => readText(item, 'value') ?? '',
                          ),
                      ],
                  ]
                : [];
        }),
    );

const valueListsEntry = (valueLists: Record<string, string[]>) =>
    Object.keys(valueLists).length ? { valueLists } : {};

const readVisibilityRule = (
    element: XmlElement,
    file: XmlFile,
    registry: XmlSourceRegistry,
): { visibilityRule?: FlexiPageVisibilityRule } => {
    const rule = childOf(element, 'visibilityRule');
    if (!rule) return {};
    const booleanFilter = childOf(rule, 'booleanFilter');
    return {
        visibilityRule: makeMetadataJson<FlexiPageVisibilityRule>(
            'flexiPageVisibilityRule',
            {
                ...(booleanFilter
                    ? { booleanFilter: readFilterLogic(booleanFilter, { file, registry }) }
                    : {}),
                criteria: readCriteria(rule, 'criteria', VISIBILITY_CRITERION_NAMES, {
                    file,
                    registry,
                }),
            },
            rule,
            file,
            registry,
        ),
    };
};

const makeItems = (
    region: XmlElement,
    regionName: string,
    file: XmlFile,
    registry: XmlSourceRegistry,
) => {
    const components: FlexiPageComponentJson[] = [];
    const fields: FlexiPageFieldJson[] = [];
    const order: string[] = [];
    childrenOf(region, 'itemInstances').forEach((item, index) => {
        const component = childOf(item, 'componentInstance');
        if (component) {
            const componentName = readText(component, 'componentName') ?? '';
            components.push(
                makeMetadataJson<FlexiPageComponentJson>(
                    'flexiPageComponent',
                    {
                        identifier:
                            readText(component, 'identifier') ??
                            `${regionName}:${componentName}:${index + 1}`,
                        componentName,
                        region: regionName,
                        ...attributesEntry(
                            readNameValues(component, 'componentInstanceProperties'),
                        ),
                        ...valueListsEntry(
                            readValueLists(component, 'componentInstanceProperties'),
                        ),
                        ...readVisibilityRule(component, file, registry),
                    },
                    component,
                    file,
                    registry,
                ),
            );
            order.push(components.at(-1)!.identifier);
        }
        const field = childOf(item, 'fieldInstance');
        if (field) {
            const fieldItem = readText(field, 'fieldItem') ?? '';
            fields.push(
                makeMetadataJson<FlexiPageFieldJson>(
                    'flexiPageField',
                    {
                        identifier: readText(field, 'identifier') ?? `${regionName}:${fieldItem}`,
                        fieldItem,
                        region: regionName,
                        ...attributesEntry(readNameValues(field, 'fieldInstanceProperties')),
                        ...readVisibilityRule(field, file, registry),
                    },
                    field,
                    file,
                    registry,
                ),
            );
            order.push(fields.at(-1)!.identifier);
        }
    });
    return { components, fields, order };
};

export const makeFlexiPageJson = (
    file: ParsedXmlFile,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
): FlexiPageJson | null => {
    const root = readXmlRoot(file, 'FlexiPage', 'flexiPage', problems);
    if (!root) return null;

    const regionElements = childrenOf(root, 'flexiPageRegions');
    const items = regionElements.map((region) =>
        makeItems(region, readText(region, 'name') ?? '', file, registry),
    );
    const regions = regionElements.map((region, index) => {
        const regionType = readText(region, 'type');
        const mode = readText(region, 'mode');
        return makeMetadataJson<FlexiPageRegionJson>(
            'flexiPageRegion',
            {
                name: readText(region, 'name') ?? '',
                ...(regionType !== undefined ? { regionType } : {}),
                ...(mode !== undefined ? { mode } : {}),
                ...nonEmptyEntry('items', items[index]!.order),
            },
            region,
            file,
            registry,
        );
    });
    const template = childOf(root, 'template');
    const templateName = template ? readText(template, 'name') : undefined;
    const templateAttributes = template ? readNameValues(template, 'properties') : {};

    return makeMetadataJson<FlexiPageJson>(
        'flexiPage',
        {
            name: file.name,
            ...readProperties(root, FLEXI_PAGE_SCHEMA),
            ...(templateName !== undefined ? { template: templateName } : {}),
            ...(Object.keys(templateAttributes).length ? { templateAttributes } : {}),
            ...nonEmptyEntry('regions', regions),
            ...nonEmptyEntry(
                'components',
                items.flatMap((item) => item.components),
            ),
            ...nonEmptyEntry(
                'fields',
                items.flatMap((item) => item.fields),
            ),
            ...nonEmptyEntry(
                'skippedElements',
                unknownChildNames(root, [
                    ...Object.keys(FLEXI_PAGE_SCHEMA),
                    'template',
                    'flexiPageRegions',
                ]),
            ),
        },
        root,
        file,
        registry,
    );
};
