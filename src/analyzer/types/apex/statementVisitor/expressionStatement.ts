import { ExpressionStatementContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ExpressionStatementType = {
    type: 'expressionStatement';
    expression: ExpressionType;
};

export const makeExpressionStatementType = (
    ctx: ExpressionStatementContext,
): ExpressionStatementType => {
    return {
        type: 'expressionStatement',
        expression: new ExpressionVisitor().visit(ctx.expression()),
    };
};

