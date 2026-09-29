import { SoslLiteralContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';
import { ClauseType, ClauseVisitor } from '../clauseVisitor';

export type SoslLiteralType = {
    type: 'soslLiteral';
    literal: {
        find: string | ExpressionType;
        soslClauses: ClauseType;
    };
};

export const makeSoslLiteralType = (ctx: SoslLiteralContext): SoslLiteralType => {
    const soslClauses = new ClauseVisitor().visit(ctx.soslClauses());

    if (ctx.FindLiteral()) {
        return {
            type: 'soslLiteral',
            literal: {
                find: ctx.FindLiteral().getText(),
                soslClauses: soslClauses,
            },
        };
    }

    if (ctx.boundExpression()) {
        const find = new ExpressionVisitor().visit(ctx.boundExpression());
        return {
            type: 'soslLiteral',
            literal: {
                find: find,
                soslClauses: soslClauses,
            },
        };
    }

    throw new Error('値が異常です。SoslLiteralContext: ' + ctx.getText());
};

