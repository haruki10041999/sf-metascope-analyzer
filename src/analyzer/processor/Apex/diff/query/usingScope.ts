import { ErrorJson, UsingScopeJson } from '../../../../types';

import { Match, NodeDiff, ValueDiff, makeNodeDiff, makeValueDiff } from '../commons';

export type UsingScopeDiff = NodeDiff<
    'usingScopeClause',
    UsingScopeJson,
    { value: ValueDiff<string> }
>;

export const makeUsingScopeDiff = (
    before: UsingScopeJson | ErrorJson,
    after: UsingScopeJson | ErrorJson,
    match: Match = 'slot',
): UsingScopeDiff =>
    makeNodeDiff('usingScopeClause', before, after, match, (b, a) => ({
        value: makeValueDiff(b.value, a.value),
    }));
