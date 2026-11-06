import type { ErrorJson, JsonType } from '../commons/json';
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

// Lightning ページ (flexipages/<名前>.flexipage-meta.xml) の JSON。方針: docs/metadata-a-plan.md 8 章
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

/** 表示条件 (visibilityRule) */
export type FlexiPageVisibilityRule = {
    booleanFilter?: string;
    criteria: { leftValue?: string; operator?: string; rightValue?: string }[];
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
    /** componentInstanceProperties (名前 → 値) */
    properties?: Record<string, string>;
    visibilityRule?: FlexiPageVisibilityRule;
};

/** 項目 (fieldInstance)。fieldItem は Record.<項目> */
export type FlexiPageFieldJson = JsonType<'flexiPageField'> & {
    identifier: string;
    fieldItem: string;
    region: string;
    properties?: Record<string, string>;
    visibilityRule?: FlexiPageVisibilityRule;
};

export type FlexiPageJson = JsonType<'flexiPage'> & {
    name: string;
    /** template の name (flexipage:recordHomeTemplateDesktop など) */
    template?: string;
    /** template の properties */
    templateProperties?: Record<string, string>;
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

const propertiesEntry = (properties: Record<string, string>) =>
    Object.keys(properties).length ? { properties } : {};

const readVisibilityRule = (element: XmlElement): { visibilityRule?: FlexiPageVisibilityRule } => {
    const rule = childOf(element, 'visibilityRule');
    if (!rule) return {};
    const booleanFilter = readText(rule, 'booleanFilter');
    return {
        visibilityRule: {
            ...(booleanFilter !== undefined ? { booleanFilter } : {}),
            criteria: childrenOf(rule, 'criteria').map((criteria) =>
                readProperties(criteria, {
                    leftValue: 'string',
                    operator: 'string',
                    rightValue: 'string',
                }),
            ),
        },
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
                        ...propertiesEntry(
                            readNameValues(component, 'componentInstanceProperties'),
                        ),
                        ...readVisibilityRule(component),
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
                        ...propertiesEntry(readNameValues(field, 'fieldInstanceProperties')),
                        ...readVisibilityRule(field),
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
): FlexiPageJson | ErrorJson => {
    const root = readXmlRoot(file, 'FlexiPage', 'flexiPage', registry, problems);
    if (!('name' in root)) return root;

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
    const templateProperties = template ? readNameValues(template, 'properties') : {};

    return makeMetadataJson<FlexiPageJson>(
        'flexiPage',
        {
            name: file.name,
            ...readProperties(root, FLEXI_PAGE_SCHEMA),
            ...(templateName !== undefined ? { template: templateName } : {}),
            ...(Object.keys(templateProperties).length ? { templateProperties } : {}),
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
