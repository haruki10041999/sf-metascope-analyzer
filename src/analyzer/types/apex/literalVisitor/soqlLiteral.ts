import { SoqlLiteralContext } from '@apexdevtools/apex-parser';

import { QueryType, QueryVisitor } from '../queryVisitor';

export type SoqlLiteralType = {
    type: 'soqlLiteral';
    value: Omit<QueryType, 'type'>;
};

export const makeSoqlLiteralType = (ctx: SoqlLiteralContext): SoqlLiteralType => {
    const { type, ...value } = new QueryVisitor().visit(ctx.query());

    return {
        type: 'soqlLiteral',
        value: value,
    };
};
