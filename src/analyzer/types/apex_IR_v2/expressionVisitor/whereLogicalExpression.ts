import {
    WhereConditionalExpressionContext,
    WhereLogicalExpressionContext,
} from '@apexdevtools/apex-parser';

import { WhereConditionalExpressionTypeClass } from '.';

import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/**
 * WHERE の条件を AND / OR でつないだもの、または NOT をつけたもの。
 * 文法は `cond (OR cond)* | cond (AND cond)* | NOT cond`。演算子があれば被演算子は 2 つ以上、NOT と演算子なしは 1 つ
 */
export type WhereLogicalExpressionType = TypeField<'whereLogicalExpression'> &
    (
        | {
              operator: 'AND' | 'OR';
              operands: [
                  WhereConditionalExpressionTypeClass,
                  WhereConditionalExpressionTypeClass,
                  ...WhereConditionalExpressionTypeClass[],
              ];
          }
        | { operator: 'NOT'; operand: WhereConditionalExpressionTypeClass }
        /** 条件が 1 つだけ (演算子なし) */
        | { operator: null; operand: WhereConditionalExpressionTypeClass }
    );

export class WhereLogicalExpressionTypeClass extends ApexCommonTypeClass<
    'whereLogicalExpression',
    WhereLogicalExpressionType
> {
    private constructor(fields: FieldsOf<WhereLogicalExpressionType>, sourceSpan: SourceSpan) {
        super('whereLogicalExpression', fields, sourceSpan);
    }

    static create(ctx: WhereLogicalExpressionContext): WhereLogicalExpressionTypeClass {
        return new WhereLogicalExpressionTypeClass(
            WhereLogicalExpressionTypeClass.createFields(ctx),
            getSourceSpan(ctx),
        );
    }

    private static createFields(
        ctx: WhereLogicalExpressionContext,
    ): FieldsOf<WhereLogicalExpressionType> {
        const create = (c: WhereConditionalExpressionContext) =>
            createNode(
                c,
                (c2) => WhereConditionalExpressionTypeClass.create(c2),
                'whereConditionalExpression',
            );

        if (ctx.NOT()) {
            return { operator: 'NOT', operand: create(ctx.whereConditionalExpression(0)) };
        }

        const operator = ctx.SOQLAND_list()?.length
            ? 'AND'
            : ctx.SOQLOR_list()?.length
              ? 'OR'
              : null;
        const list = ctx.whereConditionalExpression_list() ?? [];
        if (!operator) {
            // 条件が 1 つだけ (cond (AND cond)* の * が 0 回)
            if (list.length !== 1) {
                throw new Error('値が異常です。WhereLogicalExpressionContext: ' + ctx.getText());
            }
            return { operator: null, operand: create(list[0]!) };
        }
        if (list.length < 2) {
            throw new Error('値が異常です。WhereLogicalExpressionContext: ' + ctx.getText());
        }

        // 被演算子は数が意味を持つので、1 つでも作れなければ式ごと作らない
        const [first, second, ...rest] = list.map(create);
        return { operator, operands: [first!, second!, ...rest] };
    }

    getOperator(): WhereLogicalExpressionType['operator'] {
        return this.getFields().operator;
    }
}

export const isWhereLogicalExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is WhereLogicalExpressionTypeClass =>
    isSpicifyApexCommonTypeClass('whereLogicalExpression', target);
