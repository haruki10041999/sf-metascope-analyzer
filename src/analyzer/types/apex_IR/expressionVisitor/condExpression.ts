import { CondExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type CondExpressionType = {
    type: 'condExpression';
    expression: {
        condition: ExpressionType;
        trueValue: ExpressionType;
        falseValue: ExpressionType;
    };
};

export const makeCondExpressionType = (ctx: CondExpressionContext): CondExpressionType => {
    if (!ctx.expression(0) || !ctx.expression(1) || !ctx.expression(2)) {
        throw new Error('値が異常です。CondExpressionContext: ' + ctx.getText());
    }

    const condition = new ExpressionVisitor().visit(ctx.expression(0));
    const trueValue = new ExpressionVisitor().visit(ctx.expression(1));
    const falseValue = new ExpressionVisitor().visit(ctx.expression(2));

    return {
        type: 'condExpression',
        expression: {
            condition: condition,
            trueValue: trueValue,
            falseValue: falseValue,
        },
    };
};

