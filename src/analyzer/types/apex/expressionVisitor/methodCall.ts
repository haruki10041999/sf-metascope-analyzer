import { MethodCallExpressionContext, MethodCallContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type MethodCallExpressionType = {
    type: 'methodCall';
    methodName: string;
    params: ExpressionType[];
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
        .map((expressionCtx) => new ExpressionVisitor().visit(expressionCtx));

    return {
        type: 'methodCall',
        methodName: methodName,
        params: params,
        mode: ctx.methodCall().SUPER() ? 'Super' : ctx.methodCall().THIS() ? 'This' : 'Normal',
    };
};
