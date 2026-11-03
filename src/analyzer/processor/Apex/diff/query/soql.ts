import { ErrorJson, LimitJson, OffsetJson, SoqlJson, isErrorJson } from '../../../../types';

import {
    Match,
    NodeDiff,
    OptionalDiff,
    Sources,
    ValueDiff,
    makeNodeDiff,
    makeOptionalDiff,
} from '../commons';
import { FromClauseJson, FromFieldsDiff, makeFromDiff } from './from';
import { GroupByDiff, makeGroupByDiff } from './groupby';
import { OrderByDiff, makeOrderByDiff } from './orderBy';
import { WhereDiff, makeWhereDiff } from './where';
import { WithDiff, makeWithDiff } from './with';
import { AllRowsDiff, makeAllRowsDiff } from './allRows';
import { ForDiff, makeForDiff } from './for';
import { LimitDiff, makeLimitDiff } from './limit';
import { OffsetDiff, makeOffsetDiff } from './offset';
import { UpdateListDiff, makeUpdateListDiff } from './updateList';
import { UsingScopeDiff, makeUsingScopeDiff } from './usingScope';
import { SelectDiff, makeSelectDiff } from './select';

export type SoqlFieldsDiff = {
    select: SelectDiff;
    from: FromFieldsDiff | ValueDiff<FromClauseJson | ErrorJson>;
    where: OptionalDiff<SoqlJson['where'], WhereDiff>;
    for: OptionalDiff<SoqlJson['for'], ForDiff>;
    usingScope: OptionalDiff<SoqlJson['usingScope'], UsingScopeDiff>;
    with: OptionalDiff<SoqlJson['with'], WithDiff>;
    groupBy: OptionalDiff<SoqlJson['groupBy'], GroupByDiff>;
    orderBy: OptionalDiff<SoqlJson['orderBy'], OrderByDiff>;
    limit: OptionalDiff<LimitJson | ErrorJson, LimitDiff>;
    offset: OptionalDiff<OffsetJson | ErrorJson, OffsetDiff>;
    allRows: OptionalDiff<SoqlJson['allRows'], AllRowsDiff>;
    updateList: OptionalDiff<SoqlJson['updateList'], UpdateListDiff>;
};

export type SoqlDiff = NodeDiff<'soql', SoqlJson, SoqlFieldsDiff>;

export const makeSoqlDiff = (
    before: SoqlJson | ErrorJson,
    after: SoqlJson | ErrorJson,
    sources?: Sources,
    match: Match = 'slot',
): SoqlDiff =>
    makeNodeDiff('soql', before, after, match, (b, a) => ({
        select: makeSelectDiff(
            isErrorJson(b.select) ? b.select : b.select.field,
            isErrorJson(a.select) ? a.select : a.select.field,
            sources,
        ),
        from: makeFromDiff(b.from, a.from, sources),
        where: makeOptionalDiff(b.where, a.where, makeWhereDiff),
        for: makeOptionalDiff(b.for, a.for, makeForDiff),
        usingScope: makeOptionalDiff(b.usingScope, a.usingScope, makeUsingScopeDiff),
        with: makeOptionalDiff(b.with, a.with, makeWithDiff),
        groupBy: makeOptionalDiff(b.groupBy, a.groupBy, makeGroupByDiff),
        orderBy: makeOptionalDiff(b.orderBy, a.orderBy, (beforeOrderBy, afterOrderBy) =>
            makeOrderByDiff(beforeOrderBy, afterOrderBy, sources),
        ),
        limit: makeOptionalDiff(b.limit, a.limit, makeLimitDiff),
        offset: makeOptionalDiff(b.offset, a.offset, makeOffsetDiff),
        allRows: makeOptionalDiff(b.allRows, a.allRows, makeAllRowsDiff),
        updateList: makeOptionalDiff(b.updateList, a.updateList, makeUpdateListDiff),
    }));
