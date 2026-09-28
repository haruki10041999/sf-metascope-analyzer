import { SubExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type SubExpressionType = {
    type: 'subExpression';
    expression: ExpressionType;
};

export const makeSubExpressionType = (ctx: SubExpressionContext): SubExpressionType => {
    const expression = new ExpressionVisitor().visit(ctx.expression());

    return {
        type: 'subExpression',
        expression: expression,
    };
};

