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
} from '..//commons';

import {
    WhereClauseType,
    WhereLogicalExpressionType,
    WhereConditionalExpressionType,
    WhereFieldExpressionType,
    FieldExpressionType,
    ComparisonOperatorType,
    ValueType,
    isFieldExpressionType,
    isWhereFieldExpressionType,
} from '../converter';

import {
    makeComparisonOperatorJson,
    ValueJson,
    makeValueJson,
    SingleConditionJson,
    isSingleConditionJson,
    makeSingleConditionJson,
} from './commons';

type WhereSingleConditionJson =
    | (JsonType<'singleCondition'> & {
          field: string;
          operator:
              | '='
              | '!='
              | '<'
              | '>'
              | '<='
              | '>='
              | '<>'
              | 'LIKE'
              | 'IN'
              | 'NOT IN'
              | 'INCLUDES'
              | 'EXCLUDES';
          value: ValueJson;
      })
    | SingleConditionJson;

export const isWhereSingleConditionJson = typia.createIs<WhereSingleConditionJson>();

export const makeWhereSingleConditionJson = (
    target: ConvertType<WhereFieldExpressionType>,
    targetRecords?: Record<string, string[]>,
): WhereSingleConditionJson | ErrorJson => {
    return convertValue<
        'whereFieldExpression',
        WhereFieldExpressionType,
        WhereSingleConditionJson | ErrorJson
    >(
        ['whereFieldExpression'],
        target,
        'singleCondition',
        (target, targetRecords) => {
            if (typeof target.left === 'string') {
                const field = target.left;
                const operator = makeComparisonOperatorJson(target.operator!);
                const value = makeValueJson(target.right!);
                return makeJsonType('singleCondition', targetRecords, {
                    value: value,
                    field: field,
                    operator: operator,
                });
            } else {
                return makeSingleConditionJson(target.left, targetRecords);
            }
        },
        targetRecords,
    );
};

type WhereLogicalExpressionJson = {
    condition: (WhereSingleConditionJson | WhereLogicalExpressionJson | ErrorJson)[];
    operator?: 'AND' | 'OR' | 'NOT';
};

export const isWhereLogicalExpressionJson = typia.createIs<WhereLogicalExpressionJson>();

export const makeWhereLogicalExpressionJson = (
    target: ConvertExcludeError<WhereLogicalExpressionType>,
): WhereLogicalExpressionJson => {
    const operator = target.operator;
    const condition: (WhereSingleConditionJson | WhereLogicalExpressionJson | ErrorJson)[] = [];
    target.value.forEach((v) => {
        if (v.value.type === 'whereFieldExpression') {
            condition.push(makeWhereSingleConditionJson(v.value));
        } else {
            condition.push(makeWhereLogicalExpressionJson(v.value));
        }
    });
    return {
        condition: condition,
        ...(operator !== null ? { operator } : {}),
    };
};

export type WhereJson = {
    condition: WhereLogicalExpressionJson;
};

export const isWhereJson = typia.createIs<WhereJson>();

export const makeWhereJson = (target: ConvertExcludeError<WhereClauseType>): WhereJson => {
    return {
        condition: makeWhereLogicalExpressionJson(target.value),
    };
};
