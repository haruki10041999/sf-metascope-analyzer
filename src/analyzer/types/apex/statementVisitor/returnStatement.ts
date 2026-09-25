import { ReturnStatementContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ReturnStatementType = {
    type: 'returnStatement';
    value: Omit<ExpressionType, 'type'>;
};

export const makeReturnStatementType = (ctx: ReturnStatementContext): ReturnStatementType => {
    const { type, ...value } = new ExpressionVisitor().visit(ctx.expression());

    return {
        type: 'returnStatement',
        value: value,
    };
};

