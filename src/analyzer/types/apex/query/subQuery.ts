import typia from 'typia';

import { ErrorJson, JsonType } from '../../commons';
import type { SubQueryTypeClass } from '../../apex_IR_v2';

import { makeNodeJson } from '../commons/node';
import { SelectJson, makeSelectJson } from './select';
import { FromJson, makeFromJson } from './from';
import { WhereJson, makeWhereJson } from './where';
import { ForJson, makeForJson } from './for';
import { OrderByJson, makeOrderByJson } from './orderBy';
import { LimitJson, makeLimitJson } from './limit';
import { UpdateListJson, makeUpdateListJson } from './updateList';

// サブクエリ全体の位置を持つノード（SoqlJson と同じ扱い）
export type SubQueryJson = JsonType<'subQuery'> & {
    select: SelectJson | ErrorJson;
    from: FromJson | ErrorJson;
    where?: WhereJson | ErrorJson;
    for?: ForJson | ErrorJson;
    orderBy?: OrderByJson | ErrorJson;
    limit?: LimitJson | ErrorJson;
    updateList?: UpdateListJson | ErrorJson;
};

export const isSubQueryJson = typia.createIs<SubQueryJson>();

export const makeSubQueryJson = (target: SubQueryTypeClass): SubQueryJson => {
    const query = target.getFields();
    return makeNodeJson<SubQueryJson>('subQuery', target, {
        select: makeSelectJson(query.value),
        from: makeFromJson(query.from),
        ...(query.whereClause ? { where: makeWhereJson(query.whereClause) } : {}),
        ...(query.forClause ? { for: makeForJson(query.forClause) } : {}),
        ...(query.orderByClause ? { orderBy: makeOrderByJson(query.orderByClause) } : {}),
        ...(query.limitClause ? { limit: makeLimitJson(query.limitClause) } : {}),
        ...(query.updateList ? { updateList: makeUpdateListJson(query.updateList) } : {}),
    });
};
