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
    if (!ctx.expression(0) || !ctx.expression(1)) {
        throw new Error('値が異常です。LogOrExpressionContext: ' + ctx.getText());
    }

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

