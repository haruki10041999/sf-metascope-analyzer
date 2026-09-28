import { WhereClauseContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type WhereClauseType = {
    type: 'whereClause';
    clause: ExpressionType;
};

export const makeWhereClauseType = (ctx: WhereClauseContext): WhereClauseType => {
    const clause = new ExpressionVisitor().visit(ctx);

    return {
        type: 'whereClause',
        clause: clause,
    };
};

