import { BitAndExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type BitAndExpressionType = {
    type: 'bitAndExpression';
    expression: {
        left: ExpressionType;
        operator: '&';
        right: ExpressionType;
    };
};

export const makeBitAndExpressionType = (ctx: BitAndExpressionContext): BitAndExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    return {
        type: 'bitAndExpression',
        expression: {
            left: left,
            operator: '&',
            right: right,
        },
    };
};

