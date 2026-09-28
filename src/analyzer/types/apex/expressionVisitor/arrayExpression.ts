import { ArrayExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type ArrayExpressionType = {
    type: 'arrayExpression';
    expression: ExpressionType[];
};

export const makeArrayExpressionType = (ctx: ArrayExpressionContext): ArrayExpressionType => {
    const elements = ctx.expression_list().map((expressionCtx: ExpressionContext) => {
        const element = new ExpressionVisitor().visit(expressionCtx);
        return element;
    });

    return {
        type: 'arrayExpression',
        expression: elements,
    };
};

