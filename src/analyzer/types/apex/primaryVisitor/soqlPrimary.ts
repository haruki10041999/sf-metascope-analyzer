import { SoqlPrimaryContext } from '@apexdevtools/apex-parser';

import { LiteralType, LiteralVisitor } from '../literalVisitor';

export type SoqlPrimaryType = {
    type: 'soqlPrimary';
    primary: LiteralType;
};

export const makeSoqlPrimaryType = (ctx: SoqlPrimaryContext): SoqlPrimaryType => {
    const primary = new LiteralVisitor().visit(ctx.soqlLiteral());

    return {
        type: 'soqlPrimary',
        primary: primary,
    };
};

