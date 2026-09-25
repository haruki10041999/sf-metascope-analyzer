import { LiteralPrimaryContext } from '@apexdevtools/apex-parser';

import { LiteralType, LiteralVisitor } from '../literalVisitor';

export type LiteralPrimaryType = {
    type: 'literalPrimary';
    value: Omit<LiteralType, 'type'>;
};

export const makeLiteralPrimaryType = (ctx: LiteralPrimaryContext): LiteralPrimaryType => {
    const { type, ...value } = new LiteralVisitor().visit(ctx.literal());

    return {
        type: 'literalPrimary',
        value: value,
    };
};

