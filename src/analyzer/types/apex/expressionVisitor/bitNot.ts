import { BitNotExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type BitNotExpressionType = {
    type: 'bitNot';
    operator: '^';
    left: ExpressionType;
    right: ExpressionType;
};

export const makeBitNotExpressionType = (ctx: BitNotExpressionContext): BitNotExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    return {
        type: 'bitNot',
        operator: '^',
        left: left,
        right: right,
    };
};
