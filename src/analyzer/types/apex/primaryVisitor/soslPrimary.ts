import { SoslPrimaryContext } from '@apexdevtools/apex-parser';

import { LiteralType, LiteralVisitor } from '../literalVisitor';

export type SoslPrimaryType = {
    type: 'soslPrimary';
    primary: LiteralType;
};

export const makeSoslPrimaryType = (ctx: SoslPrimaryContext): SoslPrimaryType => {
    const primary = new LiteralVisitor().visit(ctx.soslLiteral());

    return {
        type: 'soslPrimary',
        primary: primary,
    };
};

