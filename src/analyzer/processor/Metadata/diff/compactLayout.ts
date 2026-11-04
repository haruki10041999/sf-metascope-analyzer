import { CompactLayoutJson, ErrorJson } from '../../../types';

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
    makeOrderedValuesDiff,
    makePresentDiff,
    presentEntry,
} from '../../commons/diff/present';

/** 項目は表示順なので C. 順序付き列 */
export type CompactLayoutJsonDiff = NodeDiff<
    'compactLayout',
    CompactLayoutJson,
    {
        fullName: ValueDiff<string>;
        label?: PresentDiff<string, ValueDiff<string>>;
        fields?: PresentDiff<string[], TypedListDiff<string, ValueDiff<string>>>;
    }
>;

export const makeCompactLayoutDiff = (
    before: CompactLayoutJson | ErrorJson,
    after: CompactLayoutJson | ErrorJson,
    match: Match = 'slot',
): CompactLayoutJsonDiff =>
    makeNodeDiff('compactLayout', before, after, match, (b, a) => ({
        fullName: makeValueDiff(b.fullName, a.fullName),
        ...presentEntry('label', makePresentDiff(b.label, a.label, makeValueDiff)),
        ...presentEntry('fields', makePresentDiff(b.fields, a.fields, makeOrderedValuesDiff)),
    }));
