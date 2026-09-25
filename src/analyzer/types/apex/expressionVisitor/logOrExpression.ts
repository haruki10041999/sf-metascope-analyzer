import { LogOrExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type LogOrExpressionType = {
    type: 'logOrExpression';
    operator: '||';
    left: Omit<ExpressionType, 'type'>;
    right: Omit<ExpressionType, 'type'>;
};

export const makeLogOrExpressionType = (ctx: LogOrExpressionContext): LogOrExpressionType => {
    const { type: leftType, ...left } = new ExpressionVisitor().visit(ctx.expression(0));
    const { type: rightType, ...right } = new ExpressionVisitor().visit(ctx.expression(1));

    return {
        type: 'logOrExpression',
        operator: '||',
        left: left,
        right: right,
    };
};

