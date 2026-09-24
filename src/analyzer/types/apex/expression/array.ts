import { ArrayExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type ArrayExpressionType = {
    type: 'array';
    elements: ExpressionField[];
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
