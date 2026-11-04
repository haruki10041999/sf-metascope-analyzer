import { ErrorJson, SubQueryJson, isErrorJson } from '../../../../types';

import {
    Body,
    Match,
    NodeDiff,
    OptionalDiff,
    Sources,
    ValueDiff,
    getObjectKey,
    getValueKey,
    makeNodeDiff,
    makeOptionalDiff,
    makeValueDiff,
} from '../../../commons/diff/commons';
import { FromClauseJson, FromFieldsDiff, makeFromDiff } from './from';
import { ForJsonDiff, makeForDiff } from './for';
import { LimitJsonDiff, makeLimitDiff } from './limit';
import { OrderByJsonDiff, makeOrderByDiff } from './orderBy';
import { SelectJsonDiff, makeSelectDiff } from './select';
import { UpdateListJsonDiff, makeUpdateListDiff } from './updateList';
import { WhereJsonDiff, makeWhereDiff } from './where';

export type SubQueryEntryJson = SubQueryJson & { alias?: string };
export type SubQueryBody = Body<SubQueryEntryJson>;

export type SubQueryFieldsDiff = {
    select: SelectJsonDiff;
    from: FromFieldsDiff | ValueDiff<FromClauseJson | ErrorJson>;
    where: OptionalDiff<SubQueryJson['where'], WhereJsonDiff>;
    for: OptionalDiff<SubQueryJson['for'], ForJsonDiff>;
    orderBy: OptionalDiff<SubQueryJson['orderBy'], OrderByJsonDiff>;
    limit: OptionalDiff<SubQueryJson['limit'], LimitJsonDiff>;
    updateList: OptionalDiff<SubQueryJson['updateList'], UpdateListJsonDiff>;
    alias: OptionalDiff<string, ValueDiff<string>>;
};

export type SubQueryJsonDiff = NodeDiff<'subQuery', SubQueryEntryJson, SubQueryFieldsDiff>;

export const makeSubQueryDiff = (
    before: SubQueryEntryJson | ErrorJson,
    after: SubQueryEntryJson | ErrorJson,
    match: Match = 'slot',
    sources?: Sources,
): SubQueryJsonDiff =>
    makeNodeDiff(
        'subQuery',
        before,
        after,
        match,
        (b, a) => ({
            select: makeSelectDiff(
                isErrorJson(b.select) ? b.select : b.select.field,
                isErrorJson(a.select) ? a.select : a.select.field,
                sources,
            ),
            from: makeFromDiff(b.from, a.from, sources),
            where: makeOptionalDiff(b.where, a.where, makeWhereDiff),
            for: makeOptionalDiff(b.for, a.for, makeForDiff),
            orderBy: makeOptionalDiff(b.orderBy, a.orderBy, (beforeOrderBy, afterOrderBy) =>
                makeOrderByDiff(beforeOrderBy, afterOrderBy, sources),
            ),
            limit: makeOptionalDiff(b.limit, a.limit, makeLimitDiff),
            updateList: makeOptionalDiff(b.updateList, a.updateList, makeUpdateListDiff),
            alias: makeOptionalDiff(b.alias, a.alias, makeValueDiff),
        }),
        (node) =>
            `${getObjectKey(node)}:${node.kind === 'subQuery' ? getValueKey(node.alias) : 'no-alias'}`,
    );
