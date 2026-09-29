import { WhereClauseContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type WhereClauseType = {
    type: 'whereClause';
    clause: ExpressionType;
};

export const makeWhereClauseType = (ctx: WhereClauseContext): WhereClauseType => {
    if (!ctx.whereLogicalExpression()) {
        throw new Error('値が異常です。WhereClauseContext: ' + ctx.getText());
    }

    const clause = new ExpressionVisitor().visit(ctx.whereLogicalExpression());

    return {
        type: 'whereClause',
        clause: clause,
    };
};

