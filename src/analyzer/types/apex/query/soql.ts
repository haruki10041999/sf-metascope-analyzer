import typia from 'typia';

import { ErrorJson, JsonType } from '../../commons';
import type { QueryTypeClass } from '../../apex_IR_v2';

import { makeNodeJson } from '../commons/node';
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

// クエリ全体の位置を持つノード。句の `| ErrorJson` は v1 の木の中のエラーの名残 (v2 では出てこない)
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

export const makeSoqlJson = (target: QueryTypeClass): SoqlJson => {
    const query = target.getFields();
    return makeNodeJson<SoqlJson>('soql', target, {
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
};
