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

import { OrderByClauseType, FieldOrderListType, FieldOrderType } from '../converter';
import { FieldJson, makeFieldJson } from './select';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';

const makeFieldOrderJson = (
    target: ConvertExcludeError<FieldOrderType>,
):
    | ((FieldJson | SoqlFunctionJson) & { direction?: 'ASC' | 'DESC'; nulls?: 'FIRST' | 'LAST' })
    | ErrorJson => {
    let result: FieldJson | SoqlFunctionJson | ErrorJson;
    if (target.value.type === 'fieldName') {
        result = makeFieldJson(target.value);
    } else {
        result = makeSoqlFunctionJson(target.value);
    }

    if (result.kind === 'error') {
        return result;
    }

    if (target.direction) {
        (
            result as (FieldJson | SoqlFunctionJson) & {
                direction?: 'ASC' | 'DESC';
                nulls?: 'FIRST' | 'LAST';
            }
        ).direction = target.direction;
    }
    if (target.nulls) {
        (
            result as (FieldJson | SoqlFunctionJson) & {
                direction?: 'ASC' | 'DESC';
                nulls?: 'FIRST' | 'LAST';
            }
        ).nulls = target.nulls;
    }
    return result;
};

export type OrderByJson = StructureJsonType<
    'orderByClause',
    {
        orderBy: (
            | ((FieldJson | SoqlFunctionJson) & {
                  direction?: 'ASC' | 'DESC';
                  nulls?: 'FIRST' | 'LAST';
              })
            | ErrorJson
        )[];
    }
>;

export const makeOrderByJson = (
    target: ConvertType<OrderByClauseType>,
    targetRecords?: Record<string, string[]>,
): OrderByJson | ErrorJson => {
    return convertValue<'orderByClause', 'orderByClause', OrderByClauseType, OrderByJson>(
        ['orderByClause'],
        target,
        ['orderByClause'],
        'orderByClause',
        (target, _targetRecords, _errorJson) => {
            return makeStructureJsonType('orderByClause', {
                orderBy: target.value.value.map((v) => makeFieldOrderJson(v)),
            });
        },
        targetRecords,
    );
};
