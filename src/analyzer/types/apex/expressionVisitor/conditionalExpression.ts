import { ConditionalExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type ConditionalExpressionType = {
    type: 'conditionalExpresion';
    value: Omit<ExpressionType, 'type'>;
};

export const makeConditionalExpressionType = (
    ctx: ConditionalExpressionContext,
): ConditionalExpressionType => {
    if (ctx.logicalExpression()) {
        const { type, ...value } = new ExpressionVisitor().visit(ctx.logicalExpression());
        return {
            type: 'conditionalExpresion',
            value: value,
        };
    }

    if (ctx.fieldExpression()) {
        const { type, ...value } = new ExpressionVisitor().visit(ctx.fieldExpression());
        return {
            type: 'conditionalExpresion',
            value: value,
        };
    }

    throw new Error('値が異常です。ConditionalExpressionContext: ' + ctx.getText());
};
