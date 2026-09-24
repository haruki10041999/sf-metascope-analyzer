import { Arth1ExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type Arth1ExpressionType = {
    type: 'arth1';
    operator: '*' | '/';
    left: ExpressionField;
    right: ExpressionField;
};

export const makeArth1ExpressionType = (ctx: Arth1ExpressionContext): Arth1ExpressionType => {
    const visitor = new ExpressionVisitor();
    const left = visitor.visit(ctx.expression(0));
    const right = visitor.visit(ctx.expression(1));

    if (ctx.MUL()) {
        return {
            type: 'arth1',
            operator: '*',
            left,
            right,
        };
    }
    if (ctx.DIV()) {
        return {
            type: 'arth1',
            operator: '/',
            left,
            right,
        };
    }

    throw new Error('Unsupported arth1 expression');
};
