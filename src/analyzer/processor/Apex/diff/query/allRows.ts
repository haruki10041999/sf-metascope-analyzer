import { AllRowsJson } from '../../../../types';

import { Match, NodeDiff, makeNodeDiff } from '../../../commons/diff/commons';

// ALL ROWS は値を持たないので、比べるのは位置だけ
export type AllRowsJsonDiff = NodeDiff<'allRowsClause', AllRowsJson, Record<string, never>>;

export const makeAllRowsDiff = (
    before: AllRowsJson,
    after: AllRowsJson,
    match: Match = 'slot',
): AllRowsJsonDiff => makeNodeDiff('allRowsClause', before, after, match, () => ({}));
