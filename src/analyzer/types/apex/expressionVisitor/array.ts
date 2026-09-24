import { ArrayExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type ArrayExpressionType = {
    type: 'array';
    elements: ExpressionType[];
};

export const makeArrayExpressionType = (ctx: ArrayExpressionContext): ArrayExpressionType => {
    const elements = ctx
        .expression_list()
        .map((expressionCtx: ExpressionContext) => new ExpressionVisitor().visit(expressionCtx));

    return {
        type: 'array',
        elements,
    };
};
