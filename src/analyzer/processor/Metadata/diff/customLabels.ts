import { CUSTOM_LABEL_SCHEMA, CustomLabelJson, CustomLabelsJson, ErrorJson } from '../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    makeKeyedDiff,
    makeNodeDiff,
    makeValueDiff,
} from '../../commons/diff/commons';
import { TypedListDiff } from '../../commons/diff/list';
import {
    PresentDiff,
    PropertiesDiff,
    makePresentDiff,
    makePropertiesDiff,
    makeUnorderedValuesDiff,
    presentEntry,
} from '../../commons/diff/present';

// カスタム表示ラベルの差分。方針: docs/metadata-implementation.md 10 章。ラベルは fullName で D、categories は B

export type CustomLabelJsonDiff = NodeDiff<
    'customLabel',
    CustomLabelJson,
    {
        fullName: ValueDiff<string>;
        categories?: PresentDiff<string[], TypedListDiff<string, never>>;
    } & PropertiesDiff<typeof CUSTOM_LABEL_SCHEMA>
>;

export const makeCustomLabelDiff = (
    before: CustomLabelJson,
    after: CustomLabelJson,
    match: Match = 'key',
): CustomLabelJsonDiff =>
    makeNodeDiff('customLabel', before, after, match, (b, a) => ({
        fullName: makeValueDiff(b.fullName, a.fullName),
        ...makePropertiesDiff(CUSTOM_LABEL_SCHEMA, b, a),
        ...presentEntry(
            'categories',
            makePresentDiff(b.categories, a.categories, makeUnorderedValuesDiff),
        ),
    }));

export type CustomLabelsJsonDiff = NodeDiff<
    'customLabels',
    CustomLabelsJson,
    {
        name: ValueDiff<string>;
        labels?: PresentDiff<
            CustomLabelJson[],
            ListItemDiff<'customLabel', CustomLabelJson, CustomLabelJsonDiff>[]
        >;
        skippedElements?: PresentDiff<string[], TypedListDiff<string, never>>;
    }
>;

export const makeCustomLabelsDiff = (
    before: CustomLabelsJson | ErrorJson,
    after: CustomLabelsJson | ErrorJson,
    match: Match = 'key',
    sources?: Sources,
): CustomLabelsJsonDiff =>
    makeNodeDiff('customLabels', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...presentEntry(
            'labels',
            makePresentDiff(b.labels, a.labels, (bl, al) =>
                makeKeyedDiff(
                    'customLabel',
                    bl,
                    al,
                    makeCustomLabelDiff,
                    (label) => label.fullName,
                    sources,
                ),
            ),
        ),
        ...presentEntry(
            'skippedElements',
            makePresentDiff(b.skippedElements, a.skippedElements, makeUnorderedValuesDiff),
        ),
    }));
