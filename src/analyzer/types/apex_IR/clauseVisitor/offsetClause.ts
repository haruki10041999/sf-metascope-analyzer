import { OffsetClauseContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type OffsetClauseType = {
    type: 'offsetClause';
    clause: string | ExpressionType;
};

export const makeOffsetClauseType = (ctx: OffsetClauseContext): OffsetClauseType => {
    if (ctx.IntegerLiteral()) {
        return {
            type: 'offsetClause',
            clause: ctx.IntegerLiteral().getText(),
        };
    }

    if (ctx.boundExpression()) {
        const value = new ExpressionVisitor().visit(ctx.boundExpression());

        return {
            type: 'offsetClause',
            clause: value,
        };
    }

    throw new Error('値が異常です。OffsetClauseContext: ' + ctx.getText());
};

