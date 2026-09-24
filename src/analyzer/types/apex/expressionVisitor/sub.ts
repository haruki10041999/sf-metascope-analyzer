import { SubExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type SubExpressionType = {
    type: 'sub';
    value: ExpressionType;
};

export const makeSubExpressionType = (ctx: SubExpressionContext): SubExpressionType => {
    const value = new ExpressionVisitor().visit(ctx.expression());

    return {
        type: 'sub',
        value: value,
    };
};
