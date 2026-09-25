import { CoalExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type CoalExpressionType = {
    type: 'coalExpression';
    operator: '??';
    left: Omit<ExpressionType, 'type'>;
    right: Omit<ExpressionType, 'type'>;
};

export const makeCoalExpressionType = (ctx: CoalExpressionContext): CoalExpressionType => {
    const { type: leftType, ...left } = new ExpressionVisitor().visit(ctx.expression(0));
    const { type: rightType, ...right } = new ExpressionVisitor().visit(ctx.expression(1));

    return {
        type: 'coalExpression',
        operator: '??',
        left: left,
        right: right,
    };
};

