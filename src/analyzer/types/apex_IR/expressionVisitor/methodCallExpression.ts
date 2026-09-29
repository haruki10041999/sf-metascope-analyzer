import { MethodCallExpressionContext } from '@apexdevtools/apex-parser';

import { CallType, CallVisitor } from '../callVisitor';

export type MethodCallExpressionType = {
    type: 'methodCallExpression';
    expression: CallType;
};

export const makeMethodCallExpressionType = (
    ctx: MethodCallExpressionContext,
): MethodCallExpressionType => {
    if (!ctx.methodCall()) {
        throw new Error('値が異常です。MethodCallExpressionContext: ' + ctx.getText());
    }

    const expression = new CallVisitor().visit(ctx.methodCall());

    return {
        type: 'methodCallExpression',
        expression: expression,
    };
};

