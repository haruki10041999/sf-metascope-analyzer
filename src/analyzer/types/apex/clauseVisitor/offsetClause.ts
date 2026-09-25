import { OffsetClauseContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type OffsetClauseType = {
    type: 'offsetClause';
    value: string | Omit<ExpressionType, 'type'>;
};

export const makeOffsetClauseType = (ctx: OffsetClauseContext): OffsetClauseType => {
    if (ctx.IntegerLiteral()) {
        return {
            type: 'offsetClause',
            value: ctx.IntegerLiteral().getText(),
        };
    }

    if (ctx.boundExpression()) {
        const { type, ...value } = new ExpressionVisitor().visit(ctx.boundExpression());

        return {
            type: 'offsetClause',
            value: value,
        };
    }

    throw new Error('値が異常です。OffsetClauseContext: ' + ctx.getText());
};
