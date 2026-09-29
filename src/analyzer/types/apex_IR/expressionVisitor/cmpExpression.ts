import { CmpExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type CmpExpressionType = {
    type: 'cmpExpression';
    expression: {
        left: ExpressionType;
        operator: '=' | '>' | '<';
        right: ExpressionType;
    };
};

export const makeCmpExpressionType = (ctx: CmpExpressionContext): CmpExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    if (ctx.ASSIGN()) {
        return {
            type: 'cmpExpression',
            expression: {
                left: left,
                operator: '=',
                right: right,
            },
        };
    }
    if (ctx.GT()) {
        return {
            type: 'cmpExpression',
            expression: {
                left: left,
                operator: '>',
                right: right,
            },
        };
    }
    if (ctx.LT()) {
        return {
            type: 'cmpExpression',
            expression: {
                left: left,
                operator: '<',
                right: right,
            },
        };
    }

    throw new Error('値が異常です。CmpExpressionContext: ' + ctx.getText());
};

