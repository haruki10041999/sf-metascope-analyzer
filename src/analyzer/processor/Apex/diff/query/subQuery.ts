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
} from '../commons';
import { FromClauseJson, FromFieldsDiff, makeFromDiff } from './from';
import { ForDiff, makeForDiff } from './for';
import { LimitDiff, makeLimitDiff } from './limit';
import { OrderByDiff, makeOrderByDiff } from './orderBy';
import { SelectDiff, makeSelectDiff } from './select';
import { UpdateListDiff, makeUpdateListDiff } from './updateList';
import { WhereDiff, makeWhereDiff } from './where';

export type SubQueryEntryJson = SubQueryJson & { alias?: string };
export type SubQueryBody = Body<SubQueryEntryJson>;

export type SubQueryFieldsDiff = {
    select: SelectDiff;
    from: FromFieldsDiff | ValueDiff<FromClauseJson | ErrorJson>;
    where: OptionalDiff<SubQueryJson['where'], WhereDiff>;
    for: OptionalDiff<SubQueryJson['for'], ForDiff>;
    orderBy: OptionalDiff<SubQueryJson['orderBy'], OrderByDiff>;
    limit: OptionalDiff<SubQueryJson['limit'], LimitDiff>;
    updateList: OptionalDiff<SubQueryJson['updateList'], UpdateListDiff>;
    alias: OptionalDiff<string, ValueDiff<string>>;
};

export type SubQueryDiff = NodeDiff<'subQuery', SubQueryEntryJson, SubQueryFieldsDiff>;

export const makeSubQueryDiff = (
    before: SubQueryEntryJson | ErrorJson,
    after: SubQueryEntryJson | ErrorJson,
    match: Match = 'slot',
    sources?: Sources,
): SubQueryDiff =>
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
