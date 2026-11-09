import { ConditionalExpressionContext, LogicalExpressionContext } from '@apexdevtools/apex-parser';

import { ConditionalExpressionTypeClass } from '.';

import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/**
 * SOQL の条件を AND / OR でつないだもの、または NOT をつけたもの。
 * 文法は `cond (OR cond)* | cond (AND cond)* | NOT cond`。演算子があれば被演算子は 2 つ以上、NOT と演算子なしは 1 つ
 */
export type LogicalExpressionType = TypeField<'logicalExpression'> &
    (
        | {
              operator: 'AND' | 'OR';
              operands: [
                  ConditionalExpressionTypeClass,
                  ConditionalExpressionTypeClass,
                  ...ConditionalExpressionTypeClass[],
              ];
          }
        | { operator: 'NOT'; operand: ConditionalExpressionTypeClass }
        /** 条件が 1 つだけ (演算子なし) */
        | { operator: null; operand: ConditionalExpressionTypeClass }
    );

export class LogicalExpressionTypeClass extends ApexCommonTypeClass<
    'logicalExpression',
    LogicalExpressionType
> {
    private constructor(fields: FieldsOf<LogicalExpressionType>, sourceSpan: SourceSpan) {
        super('logicalExpression', fields, sourceSpan);
    }

    static create(ctx: LogicalExpressionContext): LogicalExpressionTypeClass {
        return new LogicalExpressionTypeClass(
            LogicalExpressionTypeClass.createFields(ctx),
            getSourceSpan(ctx),
        );
    }

    private static createFields(ctx: LogicalExpressionContext): FieldsOf<LogicalExpressionType> {
        const create = (c: ConditionalExpressionContext) =>
            createNode(
                c,
                (c2) => ConditionalExpressionTypeClass.create(c2),
                'conditionalExpression',
            );

        if (ctx.NOT()) {
            return { operator: 'NOT', operand: create(ctx.conditionalExpression(0)) };
        }

        const operator = ctx.SOQLAND_list()?.length
            ? 'AND'
            : ctx.SOQLOR_list()?.length
              ? 'OR'
              : null;
        const list = ctx.conditionalExpression_list() ?? [];
        if (!operator) {
            // 条件が 1 つだけ (cond (AND cond)* の * が 0 回)
            if (list.length !== 1) {
                throw new Error('値が異常です。LogicalExpressionContext: ' + ctx.getText());
            }
            return { operator: null, operand: create(list[0]!) };
        }
        if (list.length < 2) {
            throw new Error('値が異常です。LogicalExpressionContext: ' + ctx.getText());
        }

        // 被演算子は数が意味を持つので、1 つでも作れなければ式ごと作らない
        const [first, second, ...rest] = list.map(create);
        return { operator, operands: [first!, second!, ...rest] };
    }

    getOperator(): LogicalExpressionType['operator'] {
        return this.getFields().operator;
    }
}

export const isLogicalExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is LogicalExpressionTypeClass =>
    isSpicifyApexCommonTypeClass('logicalExpression', target);
