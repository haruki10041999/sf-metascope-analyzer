import { BitOrExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type BitOrExpressionType = {
    type: 'bitOr';
    operator: '|';
    left: ExpressionType;
    right: ExpressionType;
};

export const makeBitOrExpressionType = (ctx: BitOrExpressionContext): BitOrExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    return {
        type: 'bitOr',
        operator: '|',
        left: left,
        right: right,
    };
};
