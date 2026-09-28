import { ParExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type ParExpressionType = {
    type: 'ParExpression';
    expression: ExpressionType;
};

export const makeParExpressionType = (ctx: ParExpressionContext): ParExpressionType => {
    return {
        type: 'ParExpression',
        expression: new ExpressionVisitor().visit(ctx.expression()),
    };
};
