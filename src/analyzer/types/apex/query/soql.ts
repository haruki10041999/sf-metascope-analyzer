import typia from 'typia';

import { ConvertType, ConvertWithError, ErrorJson, JsonType, convertValue, makeJsonType } from '../commons';

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

// クエリ全体の位置を持つ境界ノード。句は子の変換関数（境界ノード・非境界の入れ物）がエラーを処理する
export type SoqlJson = JsonType<'soql'> & {
    select: SelectJson | ErrorJson;
    from: FromJson | ErrorJson;
    where?: WhereJson | ErrorJson;
    for?: ForJson | ErrorJson;
    usingScope?: UsingScopeJson | ErrorJson;
    with?: WithJson | ErrorJson;
    groupBy?: GroupByJson | ErrorJson;
    orderBy?: OrderByJson | ErrorJson;
    limit?: LimitJson | ErrorJson;
    offset?: OffsetJson | ErrorJson;
    allRows?: AllRowsJson | ErrorJson;
    updateList?: UpdateListJson | ErrorJson;
};

export const isSoqlJson = typia.createIs<SoqlJson>();

export const makeSoqlJson = (target: ConvertType<QueryType>): SoqlJson | ErrorJson => {
    return convertValue<'query', QueryType, SoqlJson>(
        target,
        'soql',
        (query: ConvertWithError<QueryType>, targetRecords) => {
            return makeJsonType('soql', targetRecords.base, {
                select: makeSelectJson(query.value),
                from: makeFromJson(query.from),
                ...(query.whereClause ? { where: makeWhereJson(query.whereClause) } : {}),
                ...(query.forClause ? { for: makeForJson(query.forClause) } : {}),
                ...(query.usingScope ? { usingScope: makeUsingScopeJson(query.usingScope) } : {}),
                ...(query.withClause ? { with: makeWithJson(query.withClause) } : {}),
                ...(query.groupByClause ? { groupBy: makeGroupByJson(query.groupByClause) } : {}),
                ...(query.orderByClause ? { orderBy: makeOrderByJson(query.orderByClause) } : {}),
                ...(query.limitClause ? { limit: makeLimitJson(query.limitClause) } : {}),
                ...(query.offsetClause ? { offset: makeOffsetJson(query.offsetClause) } : {}),
                ...(query.allRowsClause ? { allRows: makeAllRowsJson(query.allRowsClause) } : {}),
                ...(query.updateList ? { updateList: makeUpdateListJson(query.updateList) } : {}),
            });
        },
        { exclude: 'children' },
    );
};
