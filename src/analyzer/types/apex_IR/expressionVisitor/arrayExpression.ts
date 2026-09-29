import { ArrayExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type ArrayExpressionType = {
    type: 'arrayExpression';
    expression: ExpressionType[];
};

export const makeArrayExpressionType = (ctx: ArrayExpressionContext): ArrayExpressionType => {
    if (!ctx.expression_list() || ctx.expression_list().length === 0) {
        throw new Error('値が異常です。ArrayExpressionContext: ' + ctx.getText());
    }

    const elements = ctx.expression_list().map((expressionCtx: ExpressionContext) => {
        const element = new ExpressionVisitor().visit(expressionCtx);
        return element;
    });

    return {
        type: 'arrayExpression',
        expression: elements,
    };
};

