import { LimitClauseContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type LimitClauseType = {
    type: 'limitClause';
    value: string | Omit<ExpressionType, 'type'>;
};

export const makeLimitClauseType = (ctx: LimitClauseContext): LimitClauseType => {
    if (ctx.IntegerLiteral()) {
        return {
            type: 'limitClause',
            value: ctx.IntegerLiteral().getText(),
        };
    }

    if (ctx.boundExpression()) {
        const { type, ...value } = new ExpressionVisitor().visit(ctx.boundExpression());

        return {
            type: 'limitClause',
            value: value,
        };
    }

    throw new Error('値が異常です。LimitClauseContext: ' + ctx.getText());
};
