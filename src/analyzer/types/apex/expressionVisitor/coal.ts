import { CoalExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type CoalExpressionType = {
    type: 'coal';
    operator: '??';
    left: ExpressionType;
    right: ExpressionType;
};

export const makeCoalExpressionType = (ctx: CoalExpressionContext): CoalExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    return {
        type: 'coal',
        operator: '??',
        left,
        right,
    };
};
