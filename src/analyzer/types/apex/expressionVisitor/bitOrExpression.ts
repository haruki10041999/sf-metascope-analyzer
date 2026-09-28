import { BitOrExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type BitOrExpressionType = {
    type: 'bitOrExpression';
    expression: {
        left: ExpressionType;
        operator: '|';
        right: ExpressionType;
    };
};

export const makeBitOrExpressionType = (ctx: BitOrExpressionContext): BitOrExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    return {
        type: 'bitOrExpression',
        expression: {
            left: left,
            operator: '|',
            right: right,
        },
    };
};

