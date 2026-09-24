import { ExpressionStatementContext, ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '../expression';

export type ExpressionStatementType = {
    type: 'expression';
    expression: ExpressionField;
};

export const makeExpressionStatementType = (
    ctx: ExpressionStatementContext,
): ExpressionStatementType => {
    return {
        type: 'expression',
        expression: new ExpressionVisitor().visit(ctx.expression()),
    };
};

