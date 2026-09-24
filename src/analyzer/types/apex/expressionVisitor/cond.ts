import { CondExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type CondExpressionType = {
    type: 'cond';
    condition: ExpressionType;
    trueValue: ExpressionType;
    falseValue: ExpressionType;
};

export const makeCondExpressionType = (ctx: CondExpressionContext): CondExpressionType => {
    const condition = new ExpressionVisitor().visit(ctx.expression(0));
    const trueValue = new ExpressionVisitor().visit(ctx.expression(1));
    const falseValue = new ExpressionVisitor().visit(ctx.expression(2));

    return {
        type: 'cond',
        condition: condition,
        trueValue: trueValue,
        falseValue: falseValue,
    };
};
