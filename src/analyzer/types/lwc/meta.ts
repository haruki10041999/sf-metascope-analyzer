import type { ErrorJson, JsonType } from '../commons/json';
import { childOf, childrenOf, type XmlElement } from '../commons/xml';
import {
    makeXmlJson,
    nonEmptyEntry,
    readProperties,
    readTexts,
    readXmlRoot,
    type ParsedXmlFile,
    type PropertiesOf,
    type XmlReadProblem,
    type XmlSourceRegistry,
} from '../commons/xmlJson';

// LWC のバンドルの設定 (<名前>.js-meta.xml)。方針: docs/lwc-json-reference.md
// Apex の -meta.xml (types/apex/meta.ts) と同じく、XML の要素名をプロパティ名にし、ファイルにないものは持たない。
// targetConfig の property は値を属性に持つので、属性名をプロパティ名にする

export const LWC_BUNDLE_META_SCHEMA = {
    /** API バージョン。61.0 のような値なので文字列のまま持つ */
    apiVersion: 'string',
    isExposed: 'boolean',
    masterLabel: 'string',
    description: 'string',
} as const;

/** targetConfig の <property>。値はすべて属性 */
export const LWC_TARGET_PROPERTY_SCHEMA = {
    name: 'string',
    type: 'string',
    label: 'string',
    description: 'string',
    default: 'string',
    required: 'boolean',
    datasource: 'string',
    placeholder: 'string',
    min: 'number',
    max: 'number',
    role: 'string',
    exposedTo: 'string',
} as const;

export type LwcTargetPropertyJson = JsonType<'lwcTargetProperty'> &
    PropertiesOf<typeof LWC_TARGET_PROPERTY_SCHEMA> & { name: string };

export type LwcTargetConfigJson = JsonType<'lwcTargetConfig'> & {
    /** targets="lightning__RecordPage,lightning__AppPage" を分けたもの */
    targets: string[];
    properties?: LwcTargetPropertyJson[];
    /** <objects><object>Account</object></objects> */
    objects?: string[];
    /** <supportedFormFactor type="Large"/> の type */
    supportedFormFactors?: string[];
};

export type LwcBundleMetaJson = JsonType<'lwcBundleMeta'> &
    PropertiesOf<typeof LWC_BUNDLE_META_SCHEMA> & {
        /** <targets><target>lightning__RecordPage</target></targets> */
        targets?: string[];
        targetConfigs?: LwcTargetConfigJson[];
        /** <capabilities><capability>lightning__dynamicComponent</capability></capabilities> */
        capabilities?: string[];
    };

/** 子要素の属性を schema の型で読む。属性がないプロパティは持たない */
const readAttributes = <S extends Record<string, 'string' | 'boolean' | 'number'>>(
    element: XmlElement,
    schema: S,
): PropertiesOf<S> =>
    Object.fromEntries(
        Object.entries(schema).flatMap(([name, type]): [string, string | number | boolean][] => {
            const text = element.attributes[name];
            if (text === undefined) return [];
            if (type === 'boolean') return [[name, text === 'true']];
            if (type === 'number') {
                const value = Number(text);
                return [[name, Number.isNaN(value) ? text : value]];
            }
            return [[name, text]];
        }),
    ) as PropertiesOf<S>;

/** <targets><target>…</target></targets> のような、入れ物の中の要素の並び (入れ物がなければ空) */
const childrenIn = (element: XmlElement, container: string, item: string): XmlElement[] => {
    const parent = childOf(element, container);
    return parent ? childrenOf(parent, item) : [];
};

/** 入れ物の中の値の並び */
const readList = (element: XmlElement, container: string, item: string): string[] => {
    const parent = childOf(element, container);
    return parent ? readTexts(parent, item) : [];
};

const LWC_BUNDLE_META_KIND = 'lwcBundleMeta';
const LWC_BUNDLE_META_ROOT = 'LightningComponentBundle';

/** 読み込んだ js-meta.xml を JSON にする。読めない・ルート要素が違うときは ErrorJson (理由は problems) */
export const makeLwcBundleMetaJson = (
    file: ParsedXmlFile,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
): LwcBundleMetaJson | ErrorJson => {
    const element = readXmlRoot(
        file,
        LWC_BUNDLE_META_ROOT,
        LWC_BUNDLE_META_KIND,
        registry,
        problems,
    );
    if (!('name' in element)) {
        return element;
    }

    const targetConfigs = childrenIn(element, 'targetConfigs', 'targetConfig').map((config) =>
        makeXmlJson<LwcTargetConfigJson>(
            'lwcTargetConfig',
            {
                targets: (config.attributes.targets ?? '')
                    .split(',')
                    .map((target) => target.trim())
                    .filter(Boolean),
                ...nonEmptyEntry(
                    'properties',
                    childrenOf(config, 'property').map((property) =>
                        makeXmlJson<LwcTargetPropertyJson>(
                            'lwcTargetProperty',
                            {
                                ...readAttributes(property, LWC_TARGET_PROPERTY_SCHEMA),
                                name: property.attributes.name ?? '',
                            },
                            property,
                            file,
                            registry,
                        ),
                    ),
                ),
                ...nonEmptyEntry('objects', readList(config, 'objects', 'object')),
                ...nonEmptyEntry(
                    'supportedFormFactors',
                    childrenIn(config, 'supportedFormFactors', 'supportedFormFactor').map(
                        (factor) => factor.attributes.type ?? '',
                    ),
                ),
            },
            config,
            file,
            registry,
        ),
    );

    return makeXmlJson<LwcBundleMetaJson>(
        LWC_BUNDLE_META_KIND,
        {
            ...readProperties(element, LWC_BUNDLE_META_SCHEMA),
            ...nonEmptyEntry('targets', readList(element, 'targets', 'target')),
            ...nonEmptyEntry('targetConfigs', targetConfigs),
            ...nonEmptyEntry('capabilities', readList(element, 'capabilities', 'capability')),
        },
        element,
        file,
        registry,
    );
};
