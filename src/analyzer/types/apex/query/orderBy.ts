import typia from 'typia';

import {
    ErrorJson,
    convertValue,
    ConvertType,
    JsonType,
    makeJsonType,
    isErrorNode,
    makeErrorJson,
} from '../commons';

import { OrderByClauseType, FieldOrderListType, FieldOrderType } from '../converter';
import { FieldJson, makeFieldJson } from './select';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';

export type FieldOrderJson = JsonType<'orderField'> &
    (FieldJson | SoqlFunctionJson) & {
        direction?: 'ASC' | 'DESC';
        nulls?: 'FIRST' | 'LAST';
    };

export const makeFieldOrderJson = (
    target: ConvertType<FieldOrderType>,
): FieldOrderJson | ErrorJson => {
    return convertValue<'fieldOrder', FieldOrderType, FieldOrderJson>(
        target,
        'orderField',
        (target, targetRecords) => {
            let result: FieldJson | SoqlFunctionJson;
            if (target.value.type === 'fieldName') {
                result = makeFieldJson(target.value);
            } else {
                result = makeSoqlFunctionJson(target.value);
            }
            const finalResult: FieldOrderJson = makeJsonType('orderField', targetRecords.base, {
                ...result,
            });

            if (target.direction) {
                finalResult.direction = target.direction;
            }
            if (target.nulls) {
                finalResult.nulls = target.nulls;
            }
            return finalResult;
        },
    );
};

export type OrderByJson = {
    orderBy: (FieldOrderJson | ErrorJson)[];
};

export const makeOrderByJson = (
    target: ConvertType<OrderByClauseType>,
): OrderByJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, 'orderBy');
    }
    if (isErrorNode(target.value)) {
        return makeErrorJson(target.value, 'orderBy');
    }

    return {
        orderBy: target.value.value.map((v) => makeFieldOrderJson(v)),
    };
};

