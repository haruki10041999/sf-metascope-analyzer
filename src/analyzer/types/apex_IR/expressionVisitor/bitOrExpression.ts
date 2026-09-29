import { BitOrExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type BitOrExpressionType = {
    type: 'bitOrExpression';
    expression: {
        left: ExpressionType;
        operator: '|';
        right: ExpressionType;
    };
};

export const makeBitOrExpressionType = (ctx: BitOrExpressionContext): BitOrExpressionType => {
    if (!ctx.expression(0) || !ctx.expression(1)) {
        throw new Error('値が異常です。BitOrExpressionContext: ' + ctx.getText());
    }

    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    return {
        type: 'bitOrExpression',
        expression: {
            left: left,
            operator: '|',
            right: right,
        },
    };
};

