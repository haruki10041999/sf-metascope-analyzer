import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertExcludeError,
    mergeRecord,
    convertValue,
    ConvertType,
} from '../commons';

import { QueryType } from '../converter';

import { SelectJson, makeSelectJson } from './select';
import { FromJson, makeFromJson } from './from';
import { WhereJson, makeWhereJson } from './where';
import { ForJson, makeForJson } from './for';
import { UsingScopeJson, makeUsingScopeJson } from './usingScope';
import { WithJson, makeWithJson } from './with';
import { GroupByJson, makeGroupByJson } from './groupby';
import { OrderByJson, makeOrderByJson } from './orderBy';
import { LimitJson, makeLimitJson } from './limit';
import { OffsetJson, makeOffsetJson } from './offset';
import { AllRowsJson, makeAllRowsJson } from './allRows';
import { UpdateListJson, makeUpdateListJson } from './updateList';

export type SoqlJson = {
    select: SelectJson;
    from: FromJson;
    where?: WhereJson;
    for?: ForJson | ErrorJson;
    usingScope?: UsingScopeJson | ErrorJson;
    with?: WithJson;
    groupBy?: GroupByJson;
    orderBy?: OrderByJson;
    limit?: LimitJson | ErrorJson;
    offset?: OffsetJson | ErrorJson;
    allRows?: AllRowsJson | ErrorJson;
    updateList?: UpdateListJson | ErrorJson;
};

export const isSoqlJson = typia.createIs<SoqlJson>();

export const makeSoqlJson = (target: ConvertExcludeError<QueryType>): SoqlJson => {
    return {
        select: makeSelectJson(target.value),
        from: makeFromJson(target.from),
        ...(target.whereClause ? { where: makeWhereJson(target.whereClause) } : {}),
        ...(target.forClause ? { for: makeForJson(target.forClause) } : {}),
        ...(target.usingScope ? { usingScope: makeUsingScopeJson(target.usingScope) } : {}),
        ...(target.withClause ? { with: makeWithJson(target.withClause) } : {}),
        ...(target.groupByClause ? { groupBy: makeGroupByJson(target.groupByClause) } : {}),
        ...(target.orderByClause ? { orderBy: makeOrderByJson(target.orderByClause) } : {}),
        ...(target.limitClause ? { limit: makeLimitJson(target.limitClause) } : {}),
        ...(target.offsetClause ? { offset: makeOffsetJson(target.offsetClause) } : {}),
        ...(target.allRowsClause ? { allRows: makeAllRowsJson(target.allRowsClause) } : {}),
        ...(target.updateList ? { updateList: makeUpdateListJson(target.updateList) } : {}),
    };
};
