import { ErrorJson, UpdateListJson } from '../../../../types';

import { Match, NodeDiff, makeNodeDiff } from '../../../commons/diff/commons';
import { makeUnorderedValueListDiff } from './commons';
import { TypedListItemDiff } from '../../../commons/diff/list';

export type UpdateListJsonDiff = NodeDiff<
    'updateClause',
    UpdateListJson,
    { value: TypedListItemDiff<UpdateListJson['value'][number], never>[] }
>;

export const makeUpdateListDiff = (
    before: UpdateListJson | ErrorJson,
    after: UpdateListJson | ErrorJson,
    match: Match = 'slot',
): UpdateListJsonDiff =>
    makeNodeDiff('updateClause', before, after, match, (b, a) => ({
        value: makeUnorderedValueListDiff(b.value, a.value),
    }));
