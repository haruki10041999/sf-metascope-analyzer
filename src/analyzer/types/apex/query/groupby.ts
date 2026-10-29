import typia from 'typia';

import {
    ConvertExcludeError,
    ErrorJson,
    convertValue,
    ConvertType,
    JsonType,
    makeJsonType,
} from '../commons';

import { GroupByClauseType, FieldGroupByType } from '../converter';

import { LogicalConditionJson, makeLogicalConditionJson } from './commons';
import { FieldJson, makeFieldJson } from './select';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';

const makeGroupByFieldJson: (
    target: ConvertExcludeError<FieldGroupByType>,
) => FieldJson | SoqlFunctionJson = (target) => {
    if (target.value.type === 'fieldName') {
        return makeFieldJson(target.value);
    } else {
        return makeSoqlFunctionJson(target.value);
    }
};

export type GroupByJson = JsonType<'groupBy'> & {
    field: (FieldJson | SoqlFunctionJson)[];
    mode?: 'ROLLUP' | 'CUBE';
    having?: LogicalConditionJson | ErrorJson;
};

export const isGroupByJson = typia.createIs<GroupByJson>();

export const makeGroupByJson = (
    target: ConvertType<GroupByClauseType>,
): GroupByJson | ErrorJson => {
    return convertValue<'groupByClause', GroupByClauseType, GroupByJson>(
        target,
        'groupBy',
        (target, targetRecords) => {
            return makeJsonType('groupBy', targetRecords.base, {
                field: target.value.value.map((v) => makeGroupByFieldJson(v)),
                ...(target.mode ? { mode: target.mode } : {}),
                ...(target.having ? { having: makeLogicalConditionJson(target.having) } : {}),
            });
        },
    );
};

