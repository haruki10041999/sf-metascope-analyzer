import { ErrorJson, UsingScopeJson } from '../../../../types';

import {
    Match,
    NodeDiff,
    ValueDiff,
    makeNodeDiff,
    makeValueDiff,
} from '../../../commons/diff/commons';

export type UsingScopeJsonDiff = NodeDiff<
    'usingScopeClause',
    UsingScopeJson,
    { value: ValueDiff<string> }
>;

export const makeUsingScopeDiff = (
    before: UsingScopeJson | ErrorJson,
    after: UsingScopeJson | ErrorJson,
    match: Match = 'slot',
): UsingScopeJsonDiff =>
    makeNodeDiff('usingScopeClause', before, after, match, (b, a) => ({
        value: makeValueDiff(b.value, a.value),
    }));
