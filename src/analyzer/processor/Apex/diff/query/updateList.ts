import { ErrorJson, UpdateListJson } from '../../../../types';

import { Match, NodeDiff, makeNodeDiff } from '../commons';
import { ValueListItemDiff, makeUnorderedValueListDiff } from './commons';

export type UpdateListDiff = NodeDiff<
    'updateClause',
    UpdateListJson,
    { value: ValueListItemDiff<UpdateListJson['value'][number]>[] }
>;

export const makeUpdateListDiff = (
    before: UpdateListJson | ErrorJson,
    after: UpdateListJson | ErrorJson,
    match: Match = 'slot',
): UpdateListDiff =>
    makeNodeDiff('updateClause', before, after, match, (b, a) => ({
        value: makeUnorderedValueListDiff(b.value, a.value),
    }));
