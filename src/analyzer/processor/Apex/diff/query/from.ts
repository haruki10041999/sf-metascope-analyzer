import { ErrorJson, FromJson, JsonType, isErrorJson } from '../../../../types';

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
export type FromClauseJson = { field: (FromFieldJson | ErrorJson)[] };

export type FromFieldDiff = NodeDiff<
    'fromField',
    FromFieldJson,
    {
        field: FieldPathDiff;
        alias: OptionalDiff<string, ValueDiff<string>>;
    }
>;

export const makeFromFieldDiff = (
    before: FromFieldJson | ErrorJson,
    after: FromFieldJson | ErrorJson,
    match: Match = 'slot',
): FromFieldDiff =>
    makeNodeDiff('fromField', before, after, match, (b, a) => ({
        field: makeFieldPathDiff(b.field, a.field),
        alias: makeOptionalDiff(b.alias, a.alias, makeValueDiff),
    }));

export type FromFieldsDiff = ListItemDiff<'fromField', FromFieldJson | ErrorJson, FromFieldDiff>[];

/** FROM の項目は C. 順序付き列 (先頭が主オブジェクト)。FROM 自体がエラーなら値を丸ごと比べる */
export type FromJsonDiff = FromFieldsDiff | ValueDiff<FromJson | FromClauseJson | ErrorJson>;

export const makeFromDiff = (
    before: FromJson | FromClauseJson | ErrorJson,
    after: FromJson | FromClauseJson | ErrorJson,
    sources?: Sources,
): FromJsonDiff => {
    if (isErrorJson(before) || isErrorJson(after)) return makeValueDiff(before, after);
    return makeSequenceDiff('fromField', before.field, after.field, makeFromFieldDiff, { sources });
};
