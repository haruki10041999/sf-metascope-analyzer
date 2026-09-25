import { Arth1ExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type Arth1ExpressionType = {
    type: 'arth1Expression';
    operator: '*' | '/';
    left: Omit<ExpressionType, 'type'>;
    right: Omit<ExpressionType, 'type'>;
};

export const makeArth1ExpressionType = (ctx: Arth1ExpressionContext): Arth1ExpressionType => {
    const { type: leftType, ...left } = new ExpressionVisitor().visit(ctx.expression(0));
    const { type: rightType, ...right } = new ExpressionVisitor().visit(ctx.expression(1));

    if (ctx.MUL()) {
        return {
            type: 'arth1Expression',
            operator: '*',
            left,
            right,
        };
    }
    if (ctx.DIV()) {
        return {
            type: 'arth1Expression',
            operator: '/',
            left,
            right,
        };
    }

    throw new Error('値が異常です。Arth1ExpressionContext: ' + ctx.getText());
};

