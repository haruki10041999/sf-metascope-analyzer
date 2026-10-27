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

import { GroupByClauseType, FieldGroupByListType, FieldGroupByType } from '../converter';

import { LogicalConditionJson, makeLogicalConditionJson } from './commons';
import { FieldJson, makeFieldJson } from './select';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';

const makeGroupByFieldJson = (
    target: ConvertExcludeError<FieldGroupByListType>,
): (FieldJson | SoqlFunctionJson | ErrorJson)[] => {
    return target.value.map((v) => {
        if (v.value.type === 'fieldName') {
            return makeFieldJson(v.value);
        } else {
            return makeSoqlFunctionJson(v.value);
        }
    });
};

export type GroupByJson = StructureJsonType<
    'groupByClause',
    {
        field: Omit<FieldJson | SoqlFunctionJson | ErrorJson, 'sourceKeys'>[];
        having?: Omit<LogicalConditionJson | ErrorJson, 'sourceKeys'>;
    }
> & {
    mode?: 'ROLLUP' | 'CUBE';
};

export const isGroupByJson = typia.createIs<GroupByJson>();

export const makeGroupByJson = (
    target: ConvertType<GroupByClauseType>,
    targetRecords?: Record<string, string[]>,
): GroupByJson | ErrorJson => {
    return convertValue<'groupByClause', 'groupByClause', GroupByClauseType, GroupByJson>(
        ['groupByClause'],
        target,
        ['groupByClause'],
        'groupByClause',
        (target, _targetRecords, _errorJson) => {
            const groupByClause: GroupByJson = makeStructureJsonType(
                'groupByClause',
                {
                    field: makeGroupByFieldJson(target.value),
                    ...(target.having ? { having: makeLogicalConditionJson(target.having) } : {}),
                },
                target.mode ? { mode: target.mode } : {},
            );

            return groupByClause;
        },
        targetRecords,
    );
};
