import typia from 'typia';

import {
    ErrorJson,
    JsonType,
    makeJsonType,
    convertValue,
    ConvertType,
    isErrorNode,
    makeErrorJson,
} from '../commons';

import {
    WhereClauseType,
    WhereLogicalExpressionType,
    WhereFieldExpressionType,
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
): WhereSingleConditionJson | ErrorJson => {
    return convertValue<
        'whereFieldExpression',
        WhereFieldExpressionType,
        WhereSingleConditionJson | ErrorJson
    >(target, 'singleCondition', (target, targetRecords) => {
        if (typeof target.left === 'string') {
            const field = target.left;
            const operator = makeComparisonOperatorJson(target.operator!);
            const value = makeValueJson(target.right!);
            return makeJsonType('singleCondition', targetRecords.base, {
                value: value,
                field: field,
                operator: operator,
            });
        } else {
            return makeSingleConditionJson(target.left);
        }
    });
};

type WhereLogicalExpressionJson = {
    condition: (WhereSingleConditionJson | WhereLogicalExpressionJson | ErrorJson)[];
    operator?: 'AND' | 'OR' | 'NOT';
};

export const isWhereLogicalExpressionJson = typia.createIs<WhereLogicalExpressionJson>();

export const makeWhereLogicalExpressionJson = (
    target: ConvertType<WhereLogicalExpressionType>,
): WhereLogicalExpressionJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, 'whereCondition');
    }

    const operator = target.operator;
    const condition: (WhereSingleConditionJson | WhereLogicalExpressionJson | ErrorJson)[] = [];
    target.value.forEach((v) => {
        if (isErrorNode(v)) {
            condition.push(makeErrorJson(v, 'whereCondition'));
        } else if (v.value.type === 'whereLogicalExpression') {
            condition.push(makeWhereLogicalExpressionJson(v.value));
        } else {
            // whereFieldExpression とエラーノードは境界ノード側で処理する
            condition.push(makeWhereSingleConditionJson(v.value));
        }
    });
    return {
        condition: condition,
        ...(operator !== null ? { operator } : {}),
    };
};

export type WhereJson = {
    condition: WhereLogicalExpressionJson | ErrorJson;
};

export const isWhereJson = typia.createIs<WhereJson>();

export const makeWhereJson = (target: ConvertType<WhereClauseType>): WhereJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, 'where');
    }

    return {
        condition: makeWhereLogicalExpressionJson(target.value),
    };
};

