import { WhereClauseContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type WhereClauseType = {
    type: 'whereClause';
    condition: Omit<ExpressionType, 'type'>;
};

export const makeWhereClauseType = (ctx: WhereClauseContext): WhereClauseType => {
    const { type, ...condition } = new ExpressionVisitor().visit(ctx);

    return {
        type: 'whereClause',
        condition: condition,
    };
};
