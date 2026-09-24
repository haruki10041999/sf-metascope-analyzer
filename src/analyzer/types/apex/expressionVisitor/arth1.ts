import { Arth1ExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type Arth1ExpressionType = {
    type: 'arth1';
    operator: '*' | '/';
    left: ExpressionType;
    right: ExpressionType;
};

export const makeArth1ExpressionType = (ctx: Arth1ExpressionContext): Arth1ExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

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
