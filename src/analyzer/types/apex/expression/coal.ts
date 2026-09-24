import { CoalExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type CoalExpressionType = {
    type: 'coal';
    operator: '??';
    left: ExpressionField;
    right: ExpressionField;
};

export const makeCoalExpressionType = (ctx: CoalExpressionContext): CoalExpressionType => {
    const visitor = new ExpressionVisitor();
    const left = visitor.visit(ctx.expression(0));
    const right = visitor.visit(ctx.expression(1));

    return {
        type: 'coal',
        operator: '??',
        left,
        right,
    };
};
