import { WhereConditionalExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type WhereConditionalExpressionType = {
    type: 'whereConditionalExpression';
    expression: ExpressionType;
};

export const makeWhereConditionalExpressionType = (
    ctx: WhereConditionalExpressionContext,
): WhereConditionalExpressionType => {
    if (ctx.whereLogicalExpression()) {
        const value = new ExpressionVisitor().visit(ctx.whereLogicalExpression());
        return {
            type: 'whereConditionalExpression',
            expression: value,
        };
    }

    if (ctx.whereFieldExpression()) {
        const value = new ExpressionVisitor().visit(ctx.whereFieldExpression());
        return {
            type: 'whereConditionalExpression',
            expression: value,
        };
    }

    throw new Error('値が異常です。WhereConditionalExpressionContext: ' + ctx.getText());
};

