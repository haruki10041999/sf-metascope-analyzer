import { ExpressionStatementContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ExpressionStatementType = {
    type: 'expressionStatement';
    statement: ExpressionType;
};

export const makeExpressionStatementType = (
    ctx: ExpressionStatementContext,
): ExpressionStatementType => {
    return {
        type: 'expressionStatement',
        statement: new ExpressionVisitor().visit(ctx.expression()),
    };
};

