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
} from '../commons';
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

export const makeFromDiff = (
    before: FromJson | FromClauseJson | ErrorJson,
    after: FromJson | FromClauseJson | ErrorJson,
    sources?: Sources,
): FromFieldsDiff | ValueDiff<FromJson | FromClauseJson | ErrorJson> => {
    if (isErrorJson(before) || isErrorJson(after)) return makeValueDiff(before, after);
    return makeSequenceDiff('fromField', before.field, after.field, makeFromFieldDiff, { sources });
};
