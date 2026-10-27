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
    StructureJsonType,
    makeStructureJsonType,
} from '../commons';

import { SubQueryType } from '../converter';

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

export type SubQueryJson = StructureJsonType<
    'subQuery',
    {
        select: SelectJson | ErrorJson;
        from: FromJson | ErrorJson;
        where?: WhereJson | ErrorJson;
        for?: ForJson | ErrorJson;
        orderBy?: OrderByJson | ErrorJson;
        limit?: LimitJson | ErrorJson;
        updateList?: UpdateListJson | ErrorJson;
    }
>;

export const isSubQueryJson = typia.createIs<SubQueryJson>();

export const makeSubQueryJson = (
    target: ConvertType<SubQueryType>,
    targetRecords?: Record<string, string[]>,
): SubQueryJson | ErrorJson => {
    return convertValue<'subQuery', 'subQuery', SubQueryType, SubQueryJson>(
        ['subQuery'],
        target,
        ['subQuery'],
        'subQuery',
        (target, _targetRecords, _errorJson) => {
            return makeStructureJsonType('subQuery', {
                select: makeSelectJson(target.value),
                from: makeFromJson(target.from),
                ...(target.whereClause ? { where: makeWhereJson(target.whereClause) } : {}),
                ...(target.forClause ? { for: makeForJson(target.forClause) } : {}),
                ...(target.orderByClause ? { orderBy: makeOrderByJson(target.orderByClause) } : {}),
                ...(target.limitClause ? { limit: makeLimitJson(target.limitClause) } : {}),
                ...(target.updateList ? { updateList: makeUpdateListJson(target.updateList) } : {}),
            });
        },
        targetRecords,
    );
};
