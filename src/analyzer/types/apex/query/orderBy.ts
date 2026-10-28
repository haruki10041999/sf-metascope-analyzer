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

import { OrderByClauseType, FieldOrderListType, FieldOrderType } from '../converter';
import { FieldJson, makeFieldJson } from './select';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';

export const makeFieldOrderJson = (
    target: ConvertType<FieldOrderType>,
    targetRecords?: Record<string, string[]>,
):
    | ((FieldJson | SoqlFunctionJson) & {
          direction?: 'ASC' | 'DESC';
          nulls?: 'FIRST' | 'LAST';
      })
    | ErrorJson => {
    return convertValue<
        'fieldOrder',
        FieldOrderType,
        | ((FieldJson | SoqlFunctionJson) & {
              direction?: 'ASC' | 'DESC';
              nulls?: 'FIRST' | 'LAST';
          })
        | ErrorJson
    >(
        ['fieldOrder'],
        target,
        'fieldOrder',
        (target, targetRecords) => {
            let result: FieldJson | SoqlFunctionJson | ErrorJson;
            if (target.value.type === 'fieldName') {
                result = makeFieldJson(target.value, targetRecords);
            } else {
                result = makeSoqlFunctionJson(target.value, targetRecords);
            }

            if (isErrorJson(result)) {
                return result;
            }

            const finalResult: (FieldJson | SoqlFunctionJson) & {
                direction?: 'ASC' | 'DESC';
                nulls?: 'FIRST' | 'LAST';
            } = { ...result };
            if (target.direction) {
                finalResult.direction = target.direction;
            }
            if (target.nulls) {
                finalResult.nulls = target.nulls;
            }
            return finalResult;
        },
        targetRecords,
    );
};

export type OrderByJson = {
    orderBy: (
        | ((FieldJson | SoqlFunctionJson) & {
              direction?: 'ASC' | 'DESC';
              nulls?: 'FIRST' | 'LAST';
          })
        | ErrorJson
    )[];
};

export const makeOrderByJson = (target: ConvertExcludeError<OrderByClauseType>): OrderByJson => {
    return {
        orderBy: target.value.value.map((v) => makeFieldOrderJson(v)),
    };
};
