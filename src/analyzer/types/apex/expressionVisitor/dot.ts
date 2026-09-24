import {
    DotExpressionContext,
    DotMethodCallContext,
    ExpressionContext,
} from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type DotExpressionType = {
    type: 'dot';
    dotType: '.' | '?.';
    className: string;
    methodName: string;
    params: ExpressionType[];
};

export const makeDotExpressionType = (ctx: DotExpressionContext): DotExpressionType => {
    const className = ctx.anyId().getText();
    const methodName = ctx.dotMethodCall().anyId().getText();
    const params = ctx
        .dotMethodCall()
        .expressionList()
        .expression_list()
        .map((expressionCtx: ExpressionContext) => new ExpressionVisitor().visit(expressionCtx));

    if (ctx.QUESTIONDOT()) {
        return {
            type: 'dot',
            dotType: '?.',
            className,
            methodName,
            params,
        };
    }

    if (ctx.DOT()) {
        return {
            type: 'dot',
            dotType: '.',
            className,
            methodName,
            params,
        };
    }

    throw new Error('Unsupported dot expression');
};
