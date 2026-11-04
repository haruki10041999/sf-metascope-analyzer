import { ErrorJson, GroupByJson } from '../../../../types';

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
        having: OptionalDiff<LogicalCondition | ErrorJson, LogicalConditionJsonDiff>;
    }
>;

export const makeGroupByDiff = (
    before: GroupByJson | ErrorJson,
    after: GroupByJson | ErrorJson,
    match: Match = 'slot',
): GroupByJsonDiff =>
    makeNodeDiff('groupBy', before, after, match, (b, a) => ({
        field: makeFieldTermSequenceDiff(b.field, a.field),
        mode: makeOptionalDiff(b.mode, a.mode, makeValueDiff),
        having: makeOptionalDiff(b.having, a.having, makeLogicalConditionDiff),
    }));
