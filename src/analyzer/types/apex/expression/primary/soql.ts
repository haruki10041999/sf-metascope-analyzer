import { SoqlPrimaryContext, SoqlLiteralContext } from '@apexdevtools/apex-parser';

import { QueryField, makeQueryField } from '../../soql';

export type SoqlPrimaryType = {
    type: 'soql';
    query: QueryField;
};

export const makeSoqlPrimaryType = (ctx: SoqlPrimaryContext): SoqlPrimaryType => {
    return {
        type: 'soql',
        query: makeQueryField(ctx.soqlLiteral().query()),
    };
};
