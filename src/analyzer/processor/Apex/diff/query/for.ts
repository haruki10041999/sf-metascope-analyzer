import { ErrorJson, ForJson } from '../../../../types';

import { Match, NodeDiff, makeNodeDiff } from '../../../commons/diff/commons';
import { makeUnorderedValueListDiff } from './commons';
import { TypedListItemDiff } from '../../../commons/diff/list';

export type ForJsonDiff = NodeDiff<
    'forClause',
    ForJson,
    { value: TypedListItemDiff<string, never>[] }
>;

export const makeForDiff = (
    before: ForJson | ErrorJson,
    after: ForJson | ErrorJson,
    match: Match = 'slot',
): ForJsonDiff =>
    makeNodeDiff('forClause', before, after, match, (b, a) => ({
        value: makeUnorderedValueListDiff(b.value, a.value),
    }));
