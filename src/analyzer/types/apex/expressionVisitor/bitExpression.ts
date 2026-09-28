import { BitExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type BitExpressionType = {
    type: 'bitExpression';
    expression: {
        left: ExpressionType;
        operator: string;
        right: ExpressionType;
    };
};

export const makeBitExpressionType = (ctx: BitExpressionContext): BitExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    if (ctx.LT_list() && ctx.LT_list().length > 0) {
        return {
            type: 'bitExpression',
            expression: {
                left: left,
                operator: ctx
                    .LT_list()
                    .map((node) => node.getText())
                    .join(''),
                right: right,
            },
        };
    }

    if (ctx.GT_list() && ctx.GT_list().length > 0) {
        return {
            type: 'bitExpression',
            expression: {
                left: left,
                operator: ctx
                    .GT_list()
                    .map((node) => node.getText())
                    .join(''),
                right: right,
            },
        };
    }

    throw new Error('値が異常です。BitExpressionContext: ' + ctx.getText());
};

