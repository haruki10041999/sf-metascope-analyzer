import { BitNotExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type BitNotExpressionType = {
    type: 'bitNot';
    operator: '^';
    left: ExpressionField;
    right: ExpressionField;
};

export const makeBitNotExpressionType = (ctx: BitNotExpressionContext): BitNotExpressionType => {
    const visitor = new ExpressionVisitor();
    const left = visitor.visit(ctx.expression(0));
    const right = visitor.visit(ctx.expression(1));

    return {
        type: 'bitNot',
        operator: '^',
        left: left,
        right: right,
    };
};
