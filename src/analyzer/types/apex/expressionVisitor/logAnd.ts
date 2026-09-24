import { LogAndExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type LogAndExpressionType = {
    type: 'logAnd';
    operator: '&&';
    left: ExpressionField;
    right: ExpressionField;
};

export const makeLogAndExpressionType = (ctx: LogAndExpressionContext): LogAndExpressionType => {
    const visitor = new ExpressionVisitor();
    const left = visitor.visit(ctx.expression(0));
    const right = visitor.visit(ctx.expression(1));

    return {
        type: 'logAnd',
        operator: '&&',
        left: left,
        right: right,
    };
};
