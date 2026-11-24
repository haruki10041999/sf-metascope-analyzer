import { JsonType } from '../../commons';
import type {
    WhereClauseTypeClass,
    WhereFieldExpressionTypeClass,
    WhereLogicalExpressionTypeClass,
} from '../../apex_IR';

import { makeDerivedNodeJson, makeNodeJson } from '../commons/node';
import {
    makeComparisonOperatorJson,
    makeValueJson,
    SingleConditionJson,
    makeSingleConditionJson,
    LogicalConditionJson,
} from './commons';
import { unquoteApexString } from '../primary';

/**
 * FORMULA('...') の条件の左辺。value は数式 (引用符を除き、エスケープを戻したもの)。
 * IR に対応するノードがないので、位置は条件 (whereFieldExpression) のもの
 */
export type FormulaFieldJson = JsonType<'soqlFormula'> & {
    type: 'formula';
    value: string;
};

/** WHERE の条件 1 つ (FORMULA('...') も同じ singleCondition。field の type で分かれる) */
export const makeWhereSingleConditionJson = (
    target: WhereFieldExpressionTypeClass,
): SingleConditionJson => {
    const fields = target.getFields();
    switch (fields.kind) {
        case 'formula':
            return makeNodeJson<SingleConditionJson>('singleCondition', target, {
                field: makeDerivedNodeJson<FormulaFieldJson>('soqlFormula', target, {
                    type: 'formula',
                    value: unquoteApexString(fields.formula),
                }),
                operator: makeComparisonOperatorJson(fields.operator),
                value: makeValueJson(fields.right),
            });
        case 'field':
            // fieldExpression は fieldExpression 自身のキーを持つ
            return makeSingleConditionJson(fields.value);
    }
};

/** WHERE の条件 (HAVING・WITH の条件と同じ LogicalConditionJson) */
export const makeWhereLogicalExpressionJson = (
    target: WhereLogicalExpressionTypeClass,
): LogicalConditionJson => {
    const fields = target.getFields();
    // AND・OR は 2 つ以上、NOT と演算子なし (条件が 1 つだけ) は 1 つの被演算子
    const operands = 'operands' in fields ? fields.operands : [fields.operand];
    const condition: (SingleConditionJson | LogicalConditionJson)[] = operands.map((v) => {
        const value = v.getFields().value;
        switch (value.kind) {
            case 'whereLogicalExpression':
                return makeWhereLogicalExpressionJson(value);
            case 'whereFieldExpression':
                return makeWhereSingleConditionJson(value);
        }
    });
    return makeNodeJson<LogicalConditionJson>('soqlLogical', target, {
        condition: condition,
        ...(fields.operator !== null ? { operator: fields.operator } : {}),
    });
};

/** WHERE 句 */
export type WhereJson = JsonType<'soqlWhere'> & {
    condition: LogicalConditionJson;
};

export const makeWhereJson = (target: WhereClauseTypeClass): WhereJson =>
    makeNodeJson<WhereJson>('soqlWhere', target, {
        condition: makeWhereLogicalExpressionJson(target.getFields().value),
    });
