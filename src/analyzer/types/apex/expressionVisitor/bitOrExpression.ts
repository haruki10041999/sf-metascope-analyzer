import { BitOrExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type BitOrExpressionType = {
    type: 'bitOrExpression';
    operator: '|';
    left: Omit<ExpressionType, 'type'>;
    right: Omit<ExpressionType, 'type'>;
};

export const makeBitOrExpressionType = (ctx: BitOrExpressionContext): BitOrExpressionType => {
    const { type: leftType, ...left } = new ExpressionVisitor().visit(ctx.expression(0));
    const { type: rightType, ...right } = new ExpressionVisitor().visit(ctx.expression(1));

    return {
        type: 'bitOrExpression',
        operator: '|',
        left: left,
        right: right,
    };
};

