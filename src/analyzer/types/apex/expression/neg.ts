import { NegExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type NegExpressionType = {
    type: 'neg';
    operator: '~' | '!';
    value: ExpressionField;
};

export const makeNegExpressionType = (ctx: NegExpressionContext): NegExpressionType => {
    const visitor = new ExpressionVisitor();
    const value = visitor.visit(ctx.expression());

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
