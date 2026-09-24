import { BitNotExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type BitNotExpressionType = {
    type: 'bitNot';
    operator: '^';
    left: ExpressionField;
    right: ExpressionField;
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
