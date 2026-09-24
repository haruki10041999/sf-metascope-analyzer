import { CmpExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type CmpExpressionType = {
    type: 'cmp';
    operator: '=' | '>' | '<';
    left: ExpressionType;
    right: ExpressionType;
};

export const makeCmpExpressionType = (ctx: CmpExpressionContext): CmpExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    if (ctx.ASSIGN()) {
        return {
            type: 'cmp',
            operator: '=',
            left: left,
            right: right,
        };
    }
    if (ctx.GT()) {
        return {
            type: 'cmp',
            operator: '>',
            left: left,
            right: right,
        };
    }
    if (ctx.LT()) {
        return {
            type: 'cmp',
            operator: '<',
            left: left,
            right: right,
        };
    }

    throw new Error('Unsupported comparison operator');
};
