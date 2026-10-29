import typia from 'typia';

import { ConvertType, ConvertWithError, ErrorJson, JsonType, convertValue, makeJsonType } from '../commons';

import { SubQueryType } from '../converter';

import { SelectJson, makeSelectJson } from './select';
import { FromJson, makeFromJson } from './from';
import { WhereJson, makeWhereJson } from './where';
import { ForJson, makeForJson } from './for';
import { OrderByJson, makeOrderByJson } from './orderBy';
import { LimitJson, makeLimitJson } from './limit';
import { UpdateListJson, makeUpdateListJson } from './updateList';

// サブクエリ全体の位置を持つ境界ノード（SoqlJson と同じ扱い）
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

export const makeSubQueryJson = (target: ConvertType<SubQueryType>): SubQueryJson | ErrorJson => {
    return convertValue<'subQuery', SubQueryType, SubQueryJson>(
        target,
        'subQuery',
        (query: ConvertWithError<SubQueryType>, targetRecords) => {
            return makeJsonType('subQuery', targetRecords.base, {
                select: makeSelectJson(query.value),
                from: makeFromJson(query.from),
                ...(query.whereClause ? { where: makeWhereJson(query.whereClause) } : {}),
                ...(query.forClause ? { for: makeForJson(query.forClause) } : {}),
                ...(query.orderByClause ? { orderBy: makeOrderByJson(query.orderByClause) } : {}),
                ...(query.limitClause ? { limit: makeLimitJson(query.limitClause) } : {}),
                ...(query.updateList ? { updateList: makeUpdateListJson(query.updateList) } : {}),
            });
        },
        { exclude: 'children' },
    );
};
