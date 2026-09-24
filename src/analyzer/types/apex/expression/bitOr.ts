import { BitOrExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type BitOrExpressionType = {
    type: 'bitOr';
    operator: '|';
    left: ExpressionField;
    right: ExpressionField;
};

export const makeBitOrExpressionType = (ctx: BitOrExpressionContext): BitOrExpressionType => {
    const visitor = new ExpressionVisitor();
    const left = visitor.visit(ctx.expression(0));
    const right = visitor.visit(ctx.expression(1));

    return {
        type: 'bitOr',
        operator: '|',
        left: left,
        right: right,
    };
};
