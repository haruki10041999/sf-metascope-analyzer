import { SoqlPrimaryContext } from '@apexdevtools/apex-parser';

import { LiteralType, LiteralVisitor } from '../literalVisitor';

export type SoqlPrimaryType = {
    type: 'soqlPrimary';
    value: Omit<LiteralType, 'type'>;
};

export const makeSoqlPrimaryType = (ctx: SoqlPrimaryContext): SoqlPrimaryType => {
    const { type, ...value } = new LiteralVisitor().visit(ctx.soqlLiteral());

    return {
        type: 'soqlPrimary',
        value: value,
    };
};
