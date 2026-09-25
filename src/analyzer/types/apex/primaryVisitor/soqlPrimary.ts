import { SoqlPrimaryContext, SoqlLiteralContext } from '@apexdevtools/apex-parser';

import { QueryField, makeQueryField } from '../queryVisitor';

export type SoqlPrimaryType = {
    type: 'soqlPrimary';
    query: QueryField;
};

export const makeSoqlPrimaryType = (ctx: SoqlPrimaryContext): SoqlPrimaryType => {
    return {
        type: 'soqlPrimary',
        query: makeQueryField(ctx.soqlLiteral().query()),
    };
};

