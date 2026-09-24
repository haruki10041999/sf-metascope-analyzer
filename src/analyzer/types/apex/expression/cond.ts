import { CondExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type CondExpressionType = {
    type: 'cond';
    condition: ExpressionField;
    trueValue: ExpressionField;
    falseValue: ExpressionField;
};

export const makeCondExpressionType = (ctx: CondExpressionContext): CondExpressionType => {
    const visitor = new ExpressionVisitor();
    const condition = visitor.visit(ctx.expression(0));
    const trueValue = visitor.visit(ctx.expression(1));
    const falseValue = visitor.visit(ctx.expression(2));

    return {
        type: 'cond',
        condition: condition,
        trueValue: trueValue,
        falseValue: falseValue,
    };
};
