import { LogAndExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type LogAndExpressionType = {
    type: 'logAndExpression';
    exporession: {
        left: ExpressionType;
        operator: '&&';
        right: ExpressionType;
    };
};

export const makeLogAndExpressionType = (ctx: LogAndExpressionContext): LogAndExpressionType => {
    if (!ctx.expression(0) || !ctx.expression(1)) {
        throw new Error('値が異常です。LogAndExpressionContext: ' + ctx.getText());
    }

    const visitor = new ExpressionVisitor();
    const left = visitor.visit(ctx.expression(0));
    const right = visitor.visit(ctx.expression(1));

    return {
        type: 'logAndExpression',
        exporession: {
            left: left,
            operator: '&&',
            right: right,
        },
    };
};

