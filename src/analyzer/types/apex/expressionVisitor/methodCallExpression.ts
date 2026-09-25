import { MethodCallExpressionContext, MethodCallContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type MethodCallExpressionType = {
    type: 'methodCallExpression';
    methodName: string;
    params: Omit<ExpressionType, 'type'>[];
    mode: 'Normal' | 'Super' | 'This';
};

export const makeMethodCallExpressionType = (
    ctx: MethodCallExpressionContext,
): MethodCallExpressionType => {
    const methodName = ctx.methodCall().id().getText();

    const params = ctx
        .methodCall()
        .expressionList()
        .expression_list()
        .map((expressionCtx) => {
            const { type, ...param } = new ExpressionVisitor().visit(expressionCtx);
            return param;
        });

    return {
        type: 'methodCallExpression',
        methodName: methodName,
        params: params,
        mode: ctx.methodCall().SUPER() ? 'Super' : ctx.methodCall().THIS() ? 'This' : 'Normal',
    };
};

