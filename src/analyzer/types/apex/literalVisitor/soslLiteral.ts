import { SoslLiteralContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';
import { ClauseType, ClauseVisitor } from '../clauseVisitor';

export type SoslLiteralType = {
    type: 'soslLiteral';
    find: string | Omit<ExpressionType, 'type'>;
    soslClauses: Omit<ClauseType, 'type'>;
};

export const makeSoslLiteralType = (ctx: SoslLiteralContext): SoslLiteralType => {
    const { type, ...soslClauses } = new ClauseVisitor().visit(ctx.soslClauses());

    if (ctx.FindLiteral()) {
        return {
            type: 'soslLiteral',
            find: ctx.FindLiteral().getText(),
            soslClauses: soslClauses,
        };
    }

    if (ctx.boundExpression()) {
        const { type, ...find } = new ExpressionVisitor().visit(ctx.boundExpression());
        return {
            type: 'soslLiteral',
            find: find,
            soslClauses: soslClauses,
        };
    }

    throw new Error('値が異常です。SoslLiteralContext: ' + ctx.getText());
};
