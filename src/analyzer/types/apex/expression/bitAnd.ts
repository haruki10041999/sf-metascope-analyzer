import { BitAndExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type BitAndExpressionType = {
    type: 'bitAnd';
    operator: '&';
    left: ExpressionField;
    right: ExpressionField;
};

export const makeBitAndExpressionType = (ctx: BitAndExpressionContext): BitAndExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    return {
        type: 'bitAnd',
        operator: '&',
        left: left,
        right: right,
    };
};
