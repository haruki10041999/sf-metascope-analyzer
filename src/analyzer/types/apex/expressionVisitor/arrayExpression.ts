import { ArrayExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type ArrayExpressionType = {
    type: 'arrayExpression';
    elements: Omit<ExpressionType, 'type'>[];
};

export const makeArrayExpressionType = (ctx: ArrayExpressionContext): ArrayExpressionType => {
    const elements = ctx.expression_list().map((expressionCtx: ExpressionContext) => {
        const { type, ...element } = new ExpressionVisitor().visit(expressionCtx);
        return element;
    });

    return {
        type: 'arrayExpression',
        elements,
    };
};

