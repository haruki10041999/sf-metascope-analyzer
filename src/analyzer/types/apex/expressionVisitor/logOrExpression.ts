import { LogOrExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type LogOrExpressionType = {
    type: 'logOrExpression';
    expression: {
        left: ExpressionType;
        operator: '||';
        right: ExpressionType;
    };
};

export const makeLogOrExpressionType = (ctx: LogOrExpressionContext): LogOrExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    return {
        type: 'logOrExpression',
        expression: {
            left: left,
            operator: '||',
            right: right,
        },
    };
};

