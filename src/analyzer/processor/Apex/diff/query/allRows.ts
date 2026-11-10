import { AllRowsJson } from '../../../../types';

import {
    Match,
    NodeDiff,
    ValueDiff,
    makeNodeDiff,
    makeValueDiff,
} from '../../../commons/diff/commons';

export type AllRowsJsonDiff = NodeDiff<'allRowsClause', AllRowsJson, { value: ValueDiff<string> }>;

export const makeAllRowsDiff = (
    before: AllRowsJson,
    after: AllRowsJson,
    match: Match = 'slot',
): AllRowsJsonDiff =>
    makeNodeDiff('allRowsClause', before, after, match, (b, a) => ({
        value: makeValueDiff(b.value, a.value),
    }));
