import { BitNotExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type BitNotExpressionType = {
    type: 'bitNotExpression';
    expression: {
        left: ExpressionType;
        operator: '^';
        right: ExpressionType;
    };
};

export const makeBitNotExpressionType = (ctx: BitNotExpressionContext): BitNotExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    return {
        type: 'bitNotExpression',
        expression: {
            left: left,
            operator: '^',
            right: right,
        },
    };
};

