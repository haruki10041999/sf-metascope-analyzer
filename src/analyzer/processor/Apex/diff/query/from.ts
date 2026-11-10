import { FromJson, JsonType } from '../../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    OptionalDiff,
    Sources,
    ValueDiff,
    makeNodeDiff,
    makeOptionalDiff,
    makeSequenceDiff,
    makeValueDiff,
} from '../../../commons/diff/commons';
import { FieldPathDiff, makeFieldPathDiff } from './select';

export type FromFieldJson = JsonType<'fromField'> & { field: string[]; alias?: string };
export type FromClauseJson = { field: FromFieldJson[] };

export type FromFieldDiff = NodeDiff<
    'fromField',
    FromFieldJson,
    {
        field: FieldPathDiff;
        alias: OptionalDiff<string, ValueDiff<string>>;
    }
>;

export const makeFromFieldDiff = (
    before: FromFieldJson,
    after: FromFieldJson,
    match: Match = 'slot',
): FromFieldDiff =>
    makeNodeDiff('fromField', before, after, match, (b, a) => ({
        field: makeFieldPathDiff(b.field, a.field),
        alias: makeOptionalDiff(b.alias, a.alias, makeValueDiff),
    }));

export type FromFieldsDiff = ListItemDiff<'fromField', FromFieldJson, FromFieldDiff>[];

/** FROM の項目は C. 順序付き列 (先頭が主オブジェクト) */
export type FromJsonDiff = FromFieldsDiff;

export const makeFromDiff = (
    before: FromJson | FromClauseJson,
    after: FromJson | FromClauseJson,
    sources?: Sources,
): FromJsonDiff => {
    return makeSequenceDiff('fromField', before.field, after.field, makeFromFieldDiff, { sources });
};
