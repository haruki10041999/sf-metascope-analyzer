import { SoqlLiteralContext } from '@apexdevtools/apex-parser';

import { QueryType, QueryVisitor } from '../queryVisitor';

export type SoqlLiteralType = {
    type: 'soqlLiteral';
    literal: QueryType;
};

export const makeSoqlLiteralType = (ctx: SoqlLiteralContext): SoqlLiteralType => {
    if (!ctx.query()) {
        throw new Error('値が異常です。SoqlLiteralContext: ' + ctx.getText());
    }

    const value = new QueryVisitor().visit(ctx.query());

    return {
        type: 'soqlLiteral',
        literal: value,
    };
};

