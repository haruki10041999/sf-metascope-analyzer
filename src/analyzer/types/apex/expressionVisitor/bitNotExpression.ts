import { BitNotExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type BitNotExpressionType = {
    type: 'bitNotExpression';
    operator: '^';
    left: Omit<ExpressionType, 'type'>;
    right: Omit<ExpressionType, 'type'>;
};

export const makeBitNotExpressionType = (ctx: BitNotExpressionContext): BitNotExpressionType => {
    const { type: leftType, ...left } = new ExpressionVisitor().visit(ctx.expression(0));
    const { type: rightType, ...right } = new ExpressionVisitor().visit(ctx.expression(1));

    return {
        type: 'bitNotExpression',
        operator: '^',
        left: left,
        right: right,
    };
};

