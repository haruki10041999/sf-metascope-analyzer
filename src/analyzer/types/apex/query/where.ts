import typia from 'typia';

import { ErrorJson, JsonType } from '../../commons';
import type {
    WhereClauseTypeClass,
    WhereFieldExpressionTypeClass,
    WhereLogicalExpressionTypeClass,
} from '../../apex_IR_v2';

import { makeNodeJson } from '../commons/node';
import {
    makeComparisonOperatorJson,
    ValueJson,
    makeValueJson,
    SingleConditionJson,
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
    target: WhereFieldExpressionTypeClass,
): WhereSingleConditionJson => {
    const fields = target.getFields();
    switch (fields.kind) {
        case 'formula':
            // FORMULA('...') の field は、v1 と同じく `FORMULA(` + 文字列リテラル (引用符つき) + `)` の形にする
            return makeNodeJson<WhereSingleConditionJson>('singleCondition', target, {
                value: makeValueJson(fields.right),
                field: `FORMULA(${fields.formula})`,
                operator: makeComparisonOperatorJson(fields.operator),
            });
        case 'field':
            // fieldExpression は fieldExpression 自身のキーを持つ
            return makeSingleConditionJson(fields.value);
    }
};

type WhereLogicalExpressionJson = {
    condition: (WhereSingleConditionJson | WhereLogicalExpressionJson | ErrorJson)[];
    operator?: 'AND' | 'OR' | 'NOT';
};

export const isWhereLogicalExpressionJson = typia.createIs<WhereLogicalExpressionJson>();

export const makeWhereLogicalExpressionJson = (
    target: WhereLogicalExpressionTypeClass,
): WhereLogicalExpressionJson => {
    const fields = target.getFields();
    // AND・OR は 2 つ以上、NOT と演算子なし (条件が 1 つだけ) は 1 つの被演算子
    const operands = 'operands' in fields ? fields.operands : [fields.operand];
    const condition: (WhereSingleConditionJson | WhereLogicalExpressionJson | ErrorJson)[] =
        operands.map((v) => {
            const value = v.getFields().value;
            switch (value.kind) {
                case 'whereLogicalExpression':
                    return makeWhereLogicalExpressionJson(value);
                case 'whereFieldExpression':
                    return makeWhereSingleConditionJson(value);
            }
        });
    return {
        condition: condition,
        ...(fields.operator !== null ? { operator: fields.operator } : {}),
    };
};

export type WhereJson = {
    condition: WhereLogicalExpressionJson | ErrorJson;
};

export const isWhereJson = typia.createIs<WhereJson>();

export const makeWhereJson = (target: WhereClauseTypeClass): WhereJson => {
    return {
        condition: makeWhereLogicalExpressionJson(target.getFields().value),
    };
};
