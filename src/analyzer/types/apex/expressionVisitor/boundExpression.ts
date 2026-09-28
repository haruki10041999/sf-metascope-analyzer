import { BoundExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type BoundExpressionType = {
    type: 'boundExpression';
    expression: ExpressionType;
};

export function makeBoundExpressionType(ctx: BoundExpressionContext): BoundExpressionType {
    return {
        type: 'boundExpression',
        expression: new ExpressionVisitor().visit(ctx.expression()),
    };
}
