import { BitExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type BitExpressionType = {
    type: 'bitExpression';
    operator: string;
    left: Omit<ExpressionType, 'type'>;
    right: Omit<ExpressionType, 'type'>;
};

export const makeBitExpressionType = (ctx: BitExpressionContext): BitExpressionType => {
    const { type: leftType, ...left } = new ExpressionVisitor().visit(ctx.expression(0));
    const { type: rightType, ...right } = new ExpressionVisitor().visit(ctx.expression(1));

    if (ctx.LT_list() && ctx.LT_list().length > 0) {
        return {
            type: 'bitExpression',
            operator: ctx
                .LT_list()
                .map((node) => node.getText())
                .join(''),
            left: left,
            right: right,
        };
    }

    if (ctx.GT_list() && ctx.GT_list().length > 0) {
        return {
            type: 'bitExpression',
            operator: ctx
                .GT_list()
                .map((node) => node.getText())
                .join(''),
            left: left,
            right: right,
        };
    }

    throw new Error('値が異常です。BitExpressionContext: ' + ctx.getText());
};

