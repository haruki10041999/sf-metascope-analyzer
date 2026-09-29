import { ConditionalExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type ConditionalExpressionType = {
    type: 'conditionalExpression';
    expression: ExpressionType;
};

export const makeConditionalExpressionType = (
    ctx: ConditionalExpressionContext,
): ConditionalExpressionType => {
    if (ctx.logicalExpression()) {
        const expression = new ExpressionVisitor().visit(ctx.logicalExpression());
        return {
            type: 'conditionalExpression',
            expression: expression,
        };
    }

    if (ctx.fieldExpression()) {
        const expression = new ExpressionVisitor().visit(ctx.fieldExpression());
        return {
            type: 'conditionalExpression',
            expression: expression,
        };
    }

    throw new Error('値が異常です。ConditionalExpressionContext: ' + ctx.getText());
};

