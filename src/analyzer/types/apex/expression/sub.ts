import { SubExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type SubExpressionType = {
    type: 'sub';
    value: ExpressionField;
};

export const makeSubExpressionType = (ctx: SubExpressionContext): SubExpressionType => {
    const visitor = new ExpressionVisitor();
    const value = visitor.visit(ctx.expression());

    return {
        type: 'sub',
        value: value,
    };
};
