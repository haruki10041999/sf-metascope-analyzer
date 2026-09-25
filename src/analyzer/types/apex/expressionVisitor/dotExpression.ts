import { DotExpressionContext, DotMethodCallContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type DotExpressionType = {
    type: 'dotExpression';
    dotType: '.' | '?.';
    className: string;
    methodName: string;
    params: Omit<ExpressionType, 'type'>[];
};

export const makeDotExpressionType = (ctx: DotExpressionContext): DotExpressionType => {
    const className = ctx.anyId().getText();
    const methodName = ctx.dotMethodCall().anyId().getText();
    const params = ctx
        .dotMethodCall()
        .expressionList()
        .expression_list()
        .map((expressionCtx) => {
            const { type, ...rest } = new ExpressionVisitor().visit(expressionCtx);
            return rest;
        });

    if (ctx.QUESTIONDOT()) {
        return {
            type: 'dotExpression',
            dotType: '?.',
            className,
            methodName,
            params,
        };
    }

    if (ctx.DOT()) {
        return {
            type: 'dotExpression',
            dotType: '.',
            className,
            methodName,
            params,
        };
    }

    throw new Error('値が異常です。DotExpressionContext: ' + ctx.getText());
};

