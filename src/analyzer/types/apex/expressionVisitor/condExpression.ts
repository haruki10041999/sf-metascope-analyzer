import { CondExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type CondExpressionType = {
    type: 'condExpression';
    condition: Omit<ExpressionType, 'type'>;
    trueValue: Omit<ExpressionType, 'type'>;
    falseValue: Omit<ExpressionType, 'type'>;
};

export const makeCondExpressionType = (ctx: CondExpressionContext): CondExpressionType => {
    const { type: conditionType, ...condition } = new ExpressionVisitor().visit(ctx.expression(0));
    const { type: trueValueType, ...trueValue } = new ExpressionVisitor().visit(ctx.expression(1));
    const { type: falseValueType, ...falseValue } = new ExpressionVisitor().visit(
        ctx.expression(2),
    );

    return {
        type: 'condExpression',
        condition: condition,
        trueValue: trueValue,
        falseValue: falseValue,
    };
};

