import { SoqlLiteralContext } from '@apexdevtools/apex-parser';

import { QueryType, QueryVisitor } from '../queryVisitor';

export type SoqlLiteralType = {
    type: 'soqlLiteral';
    literal: QueryType;
};

export const makeSoqlLiteralType = (ctx: SoqlLiteralContext): SoqlLiteralType => {
    const value = new QueryVisitor().visit(ctx.query());

    return {
        type: 'soqlLiteral',
        literal: value,
    };
};

