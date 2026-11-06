import { ErrorJson, LIST_VIEW_SCHEMA, ListViewFilterJson, ListViewJson } from '../../../types';

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
    makeOrderedNamesDiff,
    makeOrderedValuesDiff,
    makePresentDiff,
    makePropertiesDiff,
    presentEntry,
} from '../../commons/diff/present';

/**
 * 列は表示順なので C. 順序付き列。検索条件も、booleanFilter の番号が並び順を指すので C
 */
export type ListViewJsonDiff = NodeDiff<
    'listView',
    ListViewJson,
    {
        fullName: ValueDiff<string>;
        columns?: PresentDiff<string[], TypedListDiff<string, ValueDiff<string>>>;
        filters?: PresentDiff<
            ListViewFilterJson[],
            TypedListDiff<ListViewFilterJson, ValueDiff<ListViewFilterJson>>
        >;
    } & PropertiesDiff<typeof LIST_VIEW_SCHEMA>
>;

export const makeListViewDiff = (
    before: ListViewJson | ErrorJson,
    after: ListViewJson | ErrorJson,
    match: Match = 'slot',
): ListViewJsonDiff =>
    makeNodeDiff('listView', before, after, match, (b, a) => ({
        fullName: makeValueDiff(b.fullName, a.fullName),
        ...makePropertiesDiff(LIST_VIEW_SCHEMA, b, a),
        ...presentEntry('columns', makePresentDiff(b.columns, a.columns, makeOrderedNamesDiff)),
        ...presentEntry('filters', makePresentDiff(b.filters, a.filters, makeOrderedValuesDiff)),
    }));
