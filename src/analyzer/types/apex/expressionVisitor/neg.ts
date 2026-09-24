import { NegExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type NegExpressionType = {
    type: 'neg';
    operator: '~' | '!';
    value: ExpressionType;
};

export const makeNegExpressionType = (ctx: NegExpressionContext): NegExpressionType => {
    const value = new ExpressionVisitor().visit(ctx.expression());

    if (ctx.TILDE()) {
        return {
            type: 'neg',
            operator: '~',
            value: value,
        };
    }

    if (ctx.BANG()) {
        return {
            type: 'neg',
            operator: '!',
            value: value,
        };
    }

    throw new Error('Unsupported neg operator');
};
