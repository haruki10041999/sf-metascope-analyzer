import { LogOrExpressionContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type LogOrExpressionType = {
    type: 'logOr';
    operator: '||';
    left: ExpressionField;
    right: ExpressionField;
};

export const makeLogOrExpressionType = (ctx: LogOrExpressionContext): LogOrExpressionType => {
    const visitor = new ExpressionVisitor();
    const left = visitor.visit(ctx.expression(0));
    const right = visitor.visit(ctx.expression(1));

    return {
        type: 'logOr',
        operator: '||',
        left: left,
        right: right,
    };
};
