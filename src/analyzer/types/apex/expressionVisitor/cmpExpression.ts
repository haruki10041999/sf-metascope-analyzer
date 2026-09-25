import { CmpExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type CmpExpressionType = {
    type: 'cmpExpression';
    operator: '=' | '>' | '<';
    left: Omit<ExpressionType, 'type'>;
    right: Omit<ExpressionType, 'type'>;
};

export const makeCmpExpressionType = (ctx: CmpExpressionContext): CmpExpressionType => {
    const { type: leftType, ...left } = new ExpressionVisitor().visit(ctx.expression(0));
    const { type: rightType, ...right } = new ExpressionVisitor().visit(ctx.expression(1));

    if (ctx.ASSIGN()) {
        return {
            type: 'cmpExpression',
            operator: '=',
            left: left,
            right: right,
        };
    }
    if (ctx.GT()) {
        return {
            type: 'cmpExpression',
            operator: '>',
            left: left,
            right: right,
        };
    }
    if (ctx.LT()) {
        return {
            type: 'cmpExpression',
            operator: '<',
            left: left,
            right: right,
        };
    }

    throw new Error('値が異常です。CmpExpressionContext: ' + ctx.getText());
};

