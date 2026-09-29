import { ReturnStatementContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ReturnStatementType = {
    type: 'returnStatement';
    statement: ExpressionType;
};

export const makeReturnStatementType = (ctx: ReturnStatementContext): ReturnStatementType => {
    if (!ctx.expression()) {
        throw new Error('値が異常です。ReturnStatementContext: ' + ctx.getText());
    }

    const value = new ExpressionVisitor().visit(ctx.expression());

    return {
        type: 'returnStatement',
        statement: value,
    };
};

