import { LogAndExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type LogAndExpressionType = {
    type: 'logAndExpression';
    operator: '&&';
    left: Omit<ExpressionType, 'type'>;
    right: Omit<ExpressionType, 'type'>;
};

export const makeLogAndExpressionType = (ctx: LogAndExpressionContext): LogAndExpressionType => {
    const visitor = new ExpressionVisitor();
    const { type: leftType, ...left } = visitor.visit(ctx.expression(0));
    const { type: rightType, ...right } = visitor.visit(ctx.expression(1));

    return {
        type: 'logAndExpression',
        operator: '&&',
        left: left,
        right: right,
    };
};

