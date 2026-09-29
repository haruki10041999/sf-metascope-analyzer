import { ExpressionStatementContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ExpressionStatementType = {
    type: 'expressionStatement';
    statement: ExpressionType;
};

export const makeExpressionStatementType = (
    ctx: ExpressionStatementContext,
): ExpressionStatementType => {
    if (!ctx.expression()) {
        throw new Error('値が異常です。ExpressionStatementContext: ' + ctx.getText());
    }

    return {
        type: 'expressionStatement',
        statement: new ExpressionVisitor().visit(ctx.expression()),
    };
};

