import { ErrorJson, LimitJson, OffsetJson, SoqlJson, isErrorJson } from '../../../../types';

import {
    Match,
    NodeDiff,
    OptionalDiff,
    Sources,
    ValueDiff,
    makeNodeDiff,
    makeOptionalDiff,
} from '../../../commons/diff/commons';
import { FromJsonDiff, makeFromDiff } from './from';
import { GroupByJsonDiff, makeGroupByDiff } from './groupby';
import { OrderByJsonDiff, makeOrderByDiff } from './orderBy';
import { WhereJsonDiff, makeWhereDiff } from './where';
import { WithJsonDiff, makeWithDiff } from './with';
import { AllRowsJsonDiff, makeAllRowsDiff } from './allRows';
import { ForJsonDiff, makeForDiff } from './for';
import { LimitJsonDiff, makeLimitDiff } from './limit';
import { OffsetJsonDiff, makeOffsetDiff } from './offset';
import { UpdateListJsonDiff, makeUpdateListDiff } from './updateList';
import { UsingScopeJsonDiff, makeUsingScopeDiff } from './usingScope';
import { SelectJsonDiff, makeSelectDiff } from './select';

export type SoqlFieldsDiff = {
    select: SelectJsonDiff;
    from: FromJsonDiff;
    where: OptionalDiff<SoqlJson['where'], WhereJsonDiff>;
    for: OptionalDiff<SoqlJson['for'], ForJsonDiff>;
    usingScope: OptionalDiff<SoqlJson['usingScope'], UsingScopeJsonDiff>;
    with: OptionalDiff<SoqlJson['with'], WithJsonDiff>;
    groupBy: OptionalDiff<SoqlJson['groupBy'], GroupByJsonDiff>;
    orderBy: OptionalDiff<SoqlJson['orderBy'], OrderByJsonDiff>;
    limit: OptionalDiff<LimitJson | ErrorJson, LimitJsonDiff>;
    offset: OptionalDiff<OffsetJson | ErrorJson, OffsetJsonDiff>;
    allRows: OptionalDiff<SoqlJson['allRows'], AllRowsJsonDiff>;
    updateList: OptionalDiff<SoqlJson['updateList'], UpdateListJsonDiff>;
};

export type SoqlJsonDiff = NodeDiff<'soql', SoqlJson, SoqlFieldsDiff>;

export const makeSoqlDiff = (
    before: SoqlJson | ErrorJson,
    after: SoqlJson | ErrorJson,
    sources?: Sources,
    match: Match = 'slot',
): SoqlJsonDiff =>
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
