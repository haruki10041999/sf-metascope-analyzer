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
    | (StructureJsonType<
          'singleCondition',
          {
              value: Omit<ValueJson, 'sourceKeys'> | Omit<ErrorJson, 'sourceKeys'>;
          }
      > & {
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
      })
    | SingleConditionJson;

export const isWhereSingleConditionJson = typia.createIs<WhereSingleConditionJson>();

export const makeWhereSingleConditionJson = (
    target: ConvertType<WhereFieldExpressionType>,
    targetRecords?: Record<string, string[]>,
): WhereSingleConditionJson | ErrorJson => {
    return convertValue<
        'whereFieldExpression',
        'singleCondition',
        WhereFieldExpressionType,
        WhereSingleConditionJson
    >(
        ['whereFieldExpression'],
        target,
        ['singleCondition'],
        'singleCondition',
        (target, _, errorJson) => {
            if (typeof target.left === 'string' && target.operator && target.right) {
                const field = target.left;
                const operator = makeComparisonOperatorJson(target.operator);
                const value = makeValueJson(target.right);
                return makeStructureJsonType(
                    'singleCondition',
                    {
                        value: value,
                    },
                    {
                        field: field,
                        operator: operator,
                    },
                );
            } else if (!(typeof target.left === 'string')) {
                return makeSingleConditionJson(target.left);
            } else {
                return errorJson;
            }
        },
        targetRecords,
    );
};

type WhereLogicalExpressionJson = StructureJsonType<
    'logicalCondition',
    {
        condition: (
            | Omit<WhereSingleConditionJson, 'sourceKeys'>
            | Omit<WhereLogicalExpressionJson, 'sourceKeys'>
            | Omit<ErrorJson, 'sourceKeys'>
        )[];
    }
> & { operator?: 'AND' | 'OR' | 'NOT' };

export const isWhereLogicalExpressionJson = typia.createIs<WhereLogicalExpressionJson>();

export const makeWhereLogicalExpressionJson = (
    target: ConvertType<WhereLogicalExpressionType>,
    targetRecords?: Record<string, string[]>,
): WhereLogicalExpressionJson | ErrorJson => {
    return convertValue<
        'whereLogicalExpression',
        'logicalCondition',
        WhereLogicalExpressionType,
        WhereLogicalExpressionJson
    >(
        ['whereLogicalExpression'],
        target,
        ['logicalCondition'],
        'logicalCondition',
        (target, _targetRecord, _errorJson) => {
            const operator = target.operator;
            const condition: (WhereSingleConditionJson | WhereLogicalExpressionJson | ErrorJson)[] =
                [];
            target.value.forEach((v) => {
                if (v.value.type === 'whereFieldExpression') {
                    condition.push(makeWhereSingleConditionJson(v.value));
                } else {
                    condition.push(makeWhereLogicalExpressionJson(v.value));
                }
            });
            return makeStructureJsonType(
                'logicalCondition',
                {
                    condition: condition,
                },
                operator !== null ? { operator } : {},
            );
        },
        targetRecords,
    );
};

export type WhereJson = StructureJsonType<
    'whereClause',
    {
        condition: Omit<WhereLogicalExpressionJson, 'sourceKeys'> | Omit<ErrorJson, 'sourceKeys'>;
    }
>;
export const isWhereJson = typia.createIs<WhereJson>();

export const makeWhereJson = (
    target: ConvertType<WhereClauseType>,
    targetRecords?: Record<string, string[]>,
): WhereJson | ErrorJson => {
    return convertValue<'whereClause', 'whereClause', WhereClauseType, WhereJson>(
        ['whereClause'],
        target,
        ['whereClause'],
        'whereClause',
        (target, _targetRecord, _errorJson) => {
            const condition = makeWhereLogicalExpressionJson(target.value);
            return makeStructureJsonType('whereClause', {
                condition: condition,
            });
        },
        targetRecords,
    );
};
