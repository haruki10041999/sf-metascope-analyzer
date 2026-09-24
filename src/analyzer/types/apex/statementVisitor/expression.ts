import { ExpressionStatementContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ExpressionStatementType = {
    type: 'expression';
    expression: ExpressionType;
};

export const makeExpressionStatementType = (
    ctx: ExpressionStatementContext,
): ExpressionStatementType => {
    return {
        type: 'expression',
        expression: new ExpressionVisitor().visit(ctx.expression()),
    };
};
