import { FIELD_SET_SCHEMA, FieldSetItemJson, FieldSetJson } from '../../../types';

import {
    Match,
    NodeDiff,
    ValueDiff,
    makeNodeDiff,
    makeValueDiff,
} from '../../commons/diff/commons';
import { TypedListDiff } from '../../commons/diff/list';
import {
    PresentDiff,
    PropertiesDiff,
    makeOrderedValuesDiff,
    makePresentDiff,
    makePropertiesDiff,
    presentEntry,
} from '../../commons/diff/present';

/** 表示する項目は表示順なので C. 順序付き列 */
export type FieldSetJsonDiff = NodeDiff<
    'fieldSet',
    FieldSetJson,
    {
        fullName: ValueDiff<string>;
        displayedFields?: PresentDiff<
            FieldSetItemJson[],
            TypedListDiff<FieldSetItemJson, ValueDiff<FieldSetItemJson>>
        >;
    } & PropertiesDiff<typeof FIELD_SET_SCHEMA>
>;

export const makeFieldSetDiff = (
    before: FieldSetJson,
    after: FieldSetJson,
    match: Match = 'slot',
): FieldSetJsonDiff =>
    makeNodeDiff('fieldSet', before, after, match, (b, a) => ({
        fullName: makeValueDiff(b.fullName, a.fullName),
        ...makePropertiesDiff(FIELD_SET_SCHEMA, b, a),
        ...presentEntry(
            'displayedFields',
            makePresentDiff(b.displayedFields, a.displayedFields, makeOrderedValuesDiff),
        ),
    }));
