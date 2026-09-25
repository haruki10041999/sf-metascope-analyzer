import { Arth2ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type Arth2ExpressionType = {
    type: 'arth2Expression';
    operator: '+' | '-';
    left: Omit<ExpressionType, 'type'>;
    right: Omit<ExpressionType, 'type'>;
};

export const makeArth2ExpressionType = (ctx: Arth2ExpressionContext): Arth2ExpressionType => {
    const { type: leftType, ...left } = new ExpressionVisitor().visit(ctx.expression(0));
    const { type: rightType, ...right } = new ExpressionVisitor().visit(ctx.expression(1));

    if (ctx.ADD()) {
        return {
            type: 'arth2Expression',
            operator: '+',
            left,
            right,
        };
    }
    if (ctx.SUB()) {
        return {
            type: 'arth2Expression',
            operator: '-',
            left,
            right,
        };
    }

    throw new Error('値が異常です。Arth2ExpressionContext: ' + ctx.getText());
};

