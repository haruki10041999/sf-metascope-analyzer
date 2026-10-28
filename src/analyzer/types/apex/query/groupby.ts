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

import { GroupByClauseType, FieldGroupByListType, FieldGroupByType } from '../converter';

import { LogicalConditionJson, makeLogicalConditionJson } from './commons';
import { FieldJson, makeFieldJson } from './select';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';

const makeGroupByFieldJson: (
    target: ConvertType<FieldGroupByType>,
    targetRecords?: Record<string, string[]>,
) => FieldJson | SoqlFunctionJson | ErrorJson = (target, targetRecords) => {
    return convertValue<'fieldGroupBy', FieldGroupByType, FieldJson | SoqlFunctionJson | ErrorJson>(
        ['fieldGroupBy'],
        target,
        'fieldGroupBy',
        (target, targetRecords) => {
            if (target.value.type === 'fieldName') {
                return makeFieldJson(target.value, targetRecords);
            } else {
                return makeSoqlFunctionJson(target.value, targetRecords);
            }
        },
        targetRecords,
    );
};

export type GroupByJson = {
    field: (FieldJson | SoqlFunctionJson | ErrorJson)[];
    mode?: 'ROLLUP' | 'CUBE';
    having?: LogicalConditionJson | ErrorJson;
};

export const isGroupByJson = typia.createIs<GroupByJson>();

export const makeGroupByJson = (target: ConvertExcludeError<GroupByClauseType>): GroupByJson => {
    return {
        field: target.value.value.map((v) => makeGroupByFieldJson(v)),
        ...(target.mode ? { mode: target.mode } : {}),
        ...(target.having ? { having: makeLogicalConditionJson(target.having) } : {}),
    };
};
