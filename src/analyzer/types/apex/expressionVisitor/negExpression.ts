import { NegExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type NegExpressionType = {
    type: 'negExpression';
    operator: '~' | '!';
    value: Omit<ExpressionType, 'type'>;
};

export const makeNegExpressionType = (ctx: NegExpressionContext): NegExpressionType => {
    const { type, ...value } = new ExpressionVisitor().visit(ctx.expression());

    if (ctx.TILDE()) {
        return {
            type: 'negExpression',
            operator: '~',
            value: value,
        };
    }

    if (ctx.BANG()) {
        return {
            type: 'negExpression',
            operator: '!',
            value: value,
        };
    }

    throw new Error('値が異常です。NegExpressionContext: ' + ctx.getText());
};

