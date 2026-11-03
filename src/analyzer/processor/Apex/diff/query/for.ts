import { ErrorJson, ForJson } from '../../../../types';

import { Match, NodeDiff, makeNodeDiff } from '../commons';
import { ValueListItemDiff, makeUnorderedValueListDiff } from './commons';

export type ForDiff = NodeDiff<'forClause', ForJson, { value: ValueListItemDiff<string>[] }>;

export const makeForDiff = (
    before: ForJson | ErrorJson,
    after: ForJson | ErrorJson,
    match: Match = 'slot',
): ForDiff =>
    makeNodeDiff('forClause', before, after, match, (b, a) => ({
        value: makeUnorderedValueListDiff(b.value, a.value),
    }));
