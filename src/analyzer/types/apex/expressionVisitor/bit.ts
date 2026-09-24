import { BitExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type BitExpressionType = {
    type: 'bit';
    operator: string;
    left: ExpressionField;
    right: ExpressionField;
};

export const makeBitExpressionType = (ctx: BitExpressionContext): BitExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    if (ctx.LT_list() && ctx.LT_list().length > 0) {
        return {
            type: 'bit',
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
            type: 'bit',
            operator: ctx
                .GT_list()
                .map((node) => node.getText())
                .join(''),
            left: left,
            right: right,
        };
    }

    throw new Error('Unsupported bit operator');
};
