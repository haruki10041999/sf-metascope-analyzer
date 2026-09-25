import { BitAndExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type BitAndExpressionType = {
    type: 'bitAndExpression';
    operator: '&';
    left: Omit<ExpressionType, 'type'>;
    right: Omit<ExpressionType, 'type'>;
};

export const makeBitAndExpressionType = (ctx: BitAndExpressionContext): BitAndExpressionType => {
    const { type: leftType, ...left } = new ExpressionVisitor().visit(ctx.expression(0));
    const { type: rightType, ...right } = new ExpressionVisitor().visit(ctx.expression(1));

    return {
        type: 'bitAndExpression',
        operator: '&',
        left: left,
        right: right,
    };
};

