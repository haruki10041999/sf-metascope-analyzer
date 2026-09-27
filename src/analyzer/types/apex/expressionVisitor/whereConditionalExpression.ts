import { WhereConditionalExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type WhereConditionalExpressionType = {
    type: 'whereConditionalExpresion';
    value: Omit<ExpressionType, 'type'>;
};

export const makeWhereConditionalExpressionType = (
    ctx: WhereConditionalExpressionContext,
): WhereConditionalExpressionType => {
    if (ctx.whereLogicalExpression()) {
        const { type, ...value } = new ExpressionVisitor().visit(ctx.whereLogicalExpression());
        return {
            type: 'whereConditionalExpresion',
            value: value,
        };
    }

    if (ctx.whereFieldExpression()) {
        const { type, ...value } = new ExpressionVisitor().visit(ctx.whereFieldExpression());
        return {
            type: 'whereConditionalExpresion',
            value: value,
        };
    }

    throw new Error('値が異常です。WhereConditionalExpressionContext: ' + ctx.getText());
};
