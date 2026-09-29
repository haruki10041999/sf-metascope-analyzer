import { LimitClauseContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type LimitClauseType = {
    type: 'limitClause';
    clause: string | ExpressionType;
};

export const makeLimitClauseType = (ctx: LimitClauseContext): LimitClauseType => {
    if (ctx.IntegerLiteral()) {
        return {
            type: 'limitClause',
            clause: ctx.IntegerLiteral().getText(),
        };
    }

    if (ctx.boundExpression()) {
        const clause = new ExpressionVisitor().visit(ctx.boundExpression());

        return {
            type: 'limitClause',
            clause: clause,
        };
    }

    throw new Error('値が異常です。LimitClauseContext: ' + ctx.getText());
};

