import { Arth2ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type Arth2ExpressionType = {
    type: 'arth2Expression';
    expression: {
        left: ExpressionType;
        operator: '+' | '-';
        right: ExpressionType;
    };
};

export const makeArth2ExpressionType = (ctx: Arth2ExpressionContext): Arth2ExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    if (ctx.ADD()) {
        return {
            type: 'arth2Expression',
            expression: {
                left,
                operator: '+',
                right,
            },
        };
    }
    if (ctx.SUB()) {
        return {
            type: 'arth2Expression',
            expression: {
                left,
                operator: '-',
                right,
            },
        };
    }

    throw new Error('値が異常です。Arth2ExpressionContext: ' + ctx.getText());
};

