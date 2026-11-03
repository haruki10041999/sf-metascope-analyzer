import { ErrorJson, LimitJson } from '../../../../types';

import { Match, NodeDiff, ValueDiff, makeNodeDiff, makeValueDiff } from '../commons';

export type LimitFieldsDiff =
    | { type: 'literal'; value: ValueDiff<string> }
    | { type: 'bind'; value: ValueDiff<LimitJson['value']> };
export type LimitDiff = NodeDiff<'limitClause', LimitJson, LimitFieldsDiff>;

export const makeLimitDiff = (
    before: LimitJson | ErrorJson,
    after: LimitJson | ErrorJson,
    match: Match = 'slot',
): LimitDiff =>
    makeNodeDiff('limitClause', before, after, match, (b, a) => {
        if (b.type !== a.type) return undefined;
        return b.type === 'literal' && a.type === 'literal'
            ? { type: 'literal', value: makeValueDiff(b.value, a.value) }
            : { type: 'bind', value: makeValueDiff(b.value, a.value) };
    });
