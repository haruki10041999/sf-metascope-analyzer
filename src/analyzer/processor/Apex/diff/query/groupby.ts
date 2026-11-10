import { GroupByJson } from '../../../../types';

import {
    Match,
    NodeDiff,
    OptionalDiff,
    ValueDiff,
    makeNodeDiff,
    makeOptionalDiff,
    makeValueDiff,
} from '../../../commons/diff/commons';
import { TypedListDiff } from '../../../commons/diff/list';
import { FieldTerm, FieldTermDiff, makeFieldTermSequenceDiff } from './commons';
import { LogicalCondition, LogicalConditionJsonDiff, makeLogicalConditionDiff } from './where';

export type GroupByJsonDiff = NodeDiff<
    'groupBy',
    GroupByJson,
    {
        field: TypedListDiff<FieldTerm, FieldTermDiff>;
        mode: OptionalDiff<'ROLLUP' | 'CUBE', ValueDiff<'ROLLUP' | 'CUBE'>>;
        having: OptionalDiff<LogicalCondition, LogicalConditionJsonDiff>;
    }
>;

export const makeGroupByDiff = (
    before: GroupByJson,
    after: GroupByJson,
    match: Match = 'slot',
): GroupByJsonDiff =>
    makeNodeDiff('groupBy', before, after, match, (b, a) => ({
        field: makeFieldTermSequenceDiff(b.field, a.field),
        mode: makeOptionalDiff(b.mode, a.mode, makeValueDiff),
        having: makeOptionalDiff(b.having, a.having, makeLogicalConditionDiff),
    }));
