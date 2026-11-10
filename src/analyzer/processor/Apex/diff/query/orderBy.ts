import { FieldOrderJson, OrderByJson } from '../../../../types';

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
    before: FieldOrderJson,
    after: FieldOrderJson,
    match: Match = 'slot',
): FieldOrderJsonDiff =>
    makeNodeDiff('orderField', before, after, match, (b, a) => ({
        field: makeFieldTermDiff(b, a),
        direction: makeOptionalDiff(b.direction, a.direction, makeValueDiff),
        nulls: makeOptionalDiff(b.nulls, a.nulls, makeValueDiff),
    }));

export type OrderByJsonDiff = {
    orderBy: ListItemDiff<'orderField', FieldOrderJson, FieldOrderJsonDiff>[];
};

export const makeOrderByDiff = (
    before: OrderByJson,
    after: OrderByJson,
    sources?: Sources,
): OrderByJsonDiff => {
    return {
        orderBy: makeSequenceDiff('orderField', before.orderBy, after.orderBy, makeOrderFieldDiff, {
            sources,
        }),
    };
};
