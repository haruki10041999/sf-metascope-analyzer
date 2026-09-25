import { MethodCallExpressionContext } from '@apexdevtools/apex-parser';

import { CallType, CallVisitor } from '../callVisitor';

export type MethodCallExpressionType = {
    type: 'methodCallExpression';
    methodCall: Omit<CallType, 'type'>;
};

export const makeMethodCallExpressionType = (
    ctx: MethodCallExpressionContext,
): MethodCallExpressionType => {
    const { type, ...methodCall } = new CallVisitor().visit(ctx.methodCall());

    return {
        type: 'methodCallExpression',
        methodCall: methodCall,
    };
};
