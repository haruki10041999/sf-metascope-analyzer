import { ErrorJson, GroupByJson } from '../../../../types';

import {
    Match,
    NodeDiff,
    OptionalDiff,
    ValueDiff,
    makeNodeDiff,
    makeOptionalDiff,
    makeValueDiff,
} from '../commons';
import { FieldTermListItemDiff, makeFieldTermSequenceDiff } from './commons';
import { LogicalCondition, LogicalConditionDiff, makeLogicalConditionDiff } from './where';

export type GroupByDiff = NodeDiff<
    'groupBy',
    GroupByJson,
    {
        field: FieldTermListItemDiff[];
        mode: OptionalDiff<'ROLLUP' | 'CUBE', ValueDiff<'ROLLUP' | 'CUBE'>>;
        having: OptionalDiff<LogicalCondition | ErrorJson, LogicalConditionDiff>;
    }
>;

export const makeGroupByDiff = (
    before: GroupByJson | ErrorJson,
    after: GroupByJson | ErrorJson,
    match: Match = 'slot',
): GroupByDiff =>
    makeNodeDiff('groupBy', before, after, match, (b, a) => ({
        field: makeFieldTermSequenceDiff(b.field, a.field),
        mode: makeOptionalDiff(b.mode, a.mode, makeValueDiff),
        having: makeOptionalDiff(b.having, a.having, makeLogicalConditionDiff),
    }));
