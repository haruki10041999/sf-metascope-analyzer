import { AllRowsJson, ErrorJson } from '../../../../types';

import { Match, NodeDiff, ValueDiff, makeNodeDiff, makeValueDiff } from '../commons';

export type AllRowsDiff = NodeDiff<'allRowsClause', AllRowsJson, { value: ValueDiff<string> }>;

export const makeAllRowsDiff = (
    before: AllRowsJson | ErrorJson,
    after: AllRowsJson | ErrorJson,
    match: Match = 'slot',
): AllRowsDiff =>
    makeNodeDiff('allRowsClause', before, after, match, (b, a) => ({
        value: makeValueDiff(b.value, a.value),
    }));
