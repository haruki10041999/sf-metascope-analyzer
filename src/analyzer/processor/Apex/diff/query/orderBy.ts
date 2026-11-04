import { ErrorJson, FieldOrderJson, OrderByJson, isErrorJson } from '../../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    OptionalDiff,
    Sources,
    ValueDiff,
    makeNodeDiff,
    makeOptionalDiff,
    makeSequenceDiff,
    makeValueDiff,
} from '../../../commons/diff/commons';
import { FieldTerm, FieldTermDiff, makeFieldTermDiff } from './commons';

export type FieldOrderJsonDiff = NodeDiff<
    'orderField',
    FieldOrderJson,
    {
        field: FieldTermDiff;
        direction: OptionalDiff<'ASC' | 'DESC', ValueDiff<'ASC' | 'DESC'>>;
        nulls: OptionalDiff<'FIRST' | 'LAST', ValueDiff<'FIRST' | 'LAST'>>;
    }
>;

export const makeOrderFieldDiff = (
    before: FieldOrderJson | ErrorJson,
    after: FieldOrderJson | ErrorJson,
    match: Match = 'slot',
): FieldOrderJsonDiff =>
    makeNodeDiff('orderField', before, after, match, (b, a) => ({
        field: makeFieldTermDiff(b, a),
        direction: makeOptionalDiff(b.direction, a.direction, makeValueDiff),
        nulls: makeOptionalDiff(b.nulls, a.nulls, makeValueDiff),
    }));

export type OrderByJsonDiff =
    | { orderBy: ListItemDiff<'orderField', FieldOrderJson | ErrorJson, FieldOrderJsonDiff>[] }
    | ValueDiff<OrderByJson | ErrorJson>;

export const makeOrderByDiff = (
    before: OrderByJson | ErrorJson,
    after: OrderByJson | ErrorJson,
    sources?: Sources,
): OrderByJsonDiff => {
    if (isErrorJson(before) || isErrorJson(after)) return makeValueDiff(before, after);
    return {
        orderBy: makeSequenceDiff('orderField', before.orderBy, after.orderBy, makeOrderFieldDiff, {
            sources,
        }),
    };
};
