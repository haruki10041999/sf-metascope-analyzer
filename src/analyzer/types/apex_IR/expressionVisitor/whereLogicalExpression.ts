import { WhereLogicalExpressionContext } from '@apexdevtools/apex-parser';

import {
    WhereConditionalExpressionTypeClass,
    ExpressionListBaseTypeClass,
    ExpressionVisitor,
    isWhereConditionalExpressionType,
} from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClassList } from '../commonVisitor';

export class WhereLogicalExpressionTypeClass extends ExpressionListBaseTypeClass<
    'whereLogicalExpression',
    WhereConditionalExpressionTypeClass
> {
    private operator: 'AND' | 'OR' | 'NOT' | null = null;

    private constructor(
        value: (WhereConditionalExpressionTypeClass | ErrorTypeClass)[],
        operator: 'AND' | 'OR' | 'NOT' | null,
    ) {
        super('whereLogicalExpression', value);
        this.operator = operator;
    }

    static create(ctx: WhereLogicalExpressionContext): WhereLogicalExpressionTypeClass {
        if (
            !ctx.whereConditionalExpression_list() ||
            ctx.whereConditionalExpression_list().length - 1 !==
                (ctx.SOQLAND_list()?.length ?? 0) + (ctx.SOQLOR_list()?.length ?? 0)
        ) {
            throw new Error('値が異常です。WhereLogicalExpressionContext: ' + ctx.getText());
        }

        return new WhereLogicalExpressionTypeClass(
            isValidClassList(
                ctx.whereConditionalExpression_list(),
                (ctx) => new ExpressionVisitor().visit(ctx),
                isWhereConditionalExpressionType,
                'whereConditionalExpression',
            ),
            ctx.SOQLAND_list()?.length
                ? 'AND'
                : ctx.SOQLOR_list()?.length
                  ? 'OR'
                  : ctx.NOT()
                    ? 'NOT'
                    : null,
        );
    }

    getOperator(): 'AND' | 'OR' | 'NOT' | null {
        return this.operator;
    }
}

export const isWhereLogicalExpressionType = (
    target: CommonTypeClass<string>,
): target is WhereLogicalExpressionTypeClass => {
    return target instanceof WhereLogicalExpressionTypeClass;
};
