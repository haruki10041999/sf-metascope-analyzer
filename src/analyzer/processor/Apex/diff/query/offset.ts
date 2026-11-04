import { ErrorJson, OffsetJson } from '../../../../types';

import {
    Match,
    NodeDiff,
    ValueDiff,
    makeNodeDiff,
    makeValueDiff,
} from '../../../commons/diff/commons';

export type OffsetFieldsDiff =
    | { type: 'literal'; value: ValueDiff<string> }
    | { type: 'bind'; value: ValueDiff<OffsetJson['value']> };
export type OffsetJsonDiff = NodeDiff<'offsetClause', OffsetJson, OffsetFieldsDiff>;

export const makeOffsetDiff = (
    before: OffsetJson | ErrorJson,
    after: OffsetJson | ErrorJson,
    match: Match = 'slot',
): OffsetJsonDiff =>
    makeNodeDiff('offsetClause', before, after, match, (b, a) => {
        if (b.type !== a.type) return undefined;
        return b.type === 'literal' && a.type === 'literal'
            ? { type: 'literal', value: makeValueDiff(b.value, a.value) }
            : { type: 'bind', value: makeValueDiff(b.value, a.value) };
    });
