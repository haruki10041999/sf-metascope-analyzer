import type { ErrorJson, JsonType } from '../commons/json';
import { childrenOf } from '../commons/xml';
import {
    makeMetadataJson,
    nonEmptyEntry,
    readProperties,
    readText,
    readXmlRoot,
    unknownChildNames,
    type ParsedXmlFile,
    type PropertiesOf,
    type XmlReadProblem,
    type XmlSourceRegistry,
} from '../commons/xmlJson';

// カスタム表示ラベル (labels/CustomLabels.labels-meta.xml) の JSON。方針: docs/metadata-a-plan.md 5 章
// 単位はファイル 1 つ。ラベルは子 (キー: fullName)

export const CUSTOM_LABEL_SCHEMA = {
    value: 'string',
    language: 'string',
    protected: 'boolean',
    shortDescription: 'string',
} as const;

/** ラベル 1 つ。categories はカンマで分けたもの */
export type CustomLabelJson = JsonType<'customLabel'> & {
    fullName: string;
    categories?: string[];
} & PropertiesOf<typeof CUSTOM_LABEL_SCHEMA>;

export type CustomLabelsJson = JsonType<'customLabels'> & {
    /** ファイル名から接尾辞を除いたもの (CustomLabels) */
    name: string;
    labels?: CustomLabelJson[];
    skippedElements?: string[];
};

export const makeCustomLabelsJson = (
    file: ParsedXmlFile,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
): CustomLabelsJson | ErrorJson => {
    const element = readXmlRoot(file, 'CustomLabels', 'customLabels', registry, problems);
    if (!('name' in element)) return element;
    const labels = childrenOf(element, 'labels').map((label) => {
        const categories = (readText(label, 'categories') ?? '')
            .split(',')
            .map((category) => category.trim())
            .filter(Boolean);
        return makeMetadataJson<CustomLabelJson>(
            'customLabel',
            {
                fullName: readText(label, 'fullName') ?? '',
                ...readProperties(label, CUSTOM_LABEL_SCHEMA),
                ...nonEmptyEntry('categories', categories),
            },
            label,
            file,
            registry,
        );
    });
    return makeMetadataJson<CustomLabelsJson>(
        'customLabels',
        {
            name: file.name,
            ...nonEmptyEntry('labels', labels),
            ...nonEmptyEntry('skippedElements', unknownChildNames(element, ['labels'])),
        },
        element,
        file,
        registry,
    );
};
