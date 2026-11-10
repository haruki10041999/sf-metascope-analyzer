import { LimitJson } from '../../../../types';

import {
    Match,
    NodeDiff,
    ValueDiff,
    makeNodeDiff,
    makeValueDiff,
} from '../../../commons/diff/commons';

export type LimitFieldsDiff =
    | { type: 'literal'; value: ValueDiff<string> }
    | { type: 'bind'; value: ValueDiff<LimitJson['value']> };
export type LimitJsonDiff = NodeDiff<'limitClause', LimitJson, LimitFieldsDiff>;

export const makeLimitDiff = (
    before: LimitJson,
    after: LimitJson,
    match: Match = 'slot',
): LimitJsonDiff =>
    makeNodeDiff('limitClause', before, after, match, (b, a) => {
        if (b.type !== a.type) return undefined;
        return b.type === 'literal' && a.type === 'literal'
            ? { type: 'literal', value: makeValueDiff(b.value, a.value) }
            : { type: 'bind', value: makeValueDiff(b.value, a.value) };
    });
