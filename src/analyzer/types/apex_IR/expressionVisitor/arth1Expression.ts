import { Arth1ExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type Arth1ExpressionType = {
    type: 'arth1Expression';
    expression: {
        left: ExpressionType;
        operator: '*' | '/';
        right: ExpressionType;
    };
};

export const makeArth1ExpressionType = (ctx: Arth1ExpressionContext): Arth1ExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    if (ctx.MUL()) {
        return {
            type: 'arth1Expression',
            expression: {
                left,
                operator: '*',
                right,
            },
        };
    }
    if (ctx.DIV()) {
        return {
            type: 'arth1Expression',
            expression: {
                left,
                operator: '/',
                right,
            },
        };
    }

    throw new Error('値が異常です。Arth1ExpressionContext: ' + ctx.getText());
};

