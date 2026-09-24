import { BitAndExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type BitAndExpressionType = {
    type: 'bitAnd';
    operator: '&';
    left: ExpressionField;
    right: ExpressionField;
};

export const makeBitAndExpressionType = (ctx: BitAndExpressionContext): BitAndExpressionType => {
    const visitor = new ExpressionVisitor();
    const left = visitor.visit(ctx.expression(0));
    const right = visitor.visit(ctx.expression(1));

    return {
        type: 'bitAnd',
        operator: '&',
        left: left,
        right: right,
    };
};
