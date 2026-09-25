import { SubExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type SubExpressionType = {
    type: 'subExpression';
    value: Omit<ExpressionType, 'type'>;
};

export const makeSubExpressionType = (ctx: SubExpressionContext): SubExpressionType => {
    const { type, ...value } = new ExpressionVisitor().visit(ctx.expression());

    return {
        type: 'subExpression',
        value: value,
    };
};

