import { Arth2ExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type Arth2ExpressionType = {
    type: 'arth2';
    operator: '+' | '-';
    left: ExpressionType;
    right: ExpressionType;
};

export const makeArth2ExpressionType = (ctx: Arth2ExpressionContext): Arth2ExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    if (ctx.ADD()) {
        return {
            type: 'arth2',
            operator: '+',
            left,
            right,
        };
    }
    if (ctx.SUB()) {
        return {
            type: 'arth2',
            operator: '-',
            left,
            right,
        };
    }

    throw new Error('Unsupported arth2 expression');
};
