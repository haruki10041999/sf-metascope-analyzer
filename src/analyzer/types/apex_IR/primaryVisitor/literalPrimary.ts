import { LiteralPrimaryContext } from '@apexdevtools/apex-parser';

import { LiteralType, LiteralVisitor } from '../literalVisitor';

export type LiteralPrimaryType = {
    type: 'literalPrimary';
    primary: LiteralType;
};

export const makeLiteralPrimaryType = (ctx: LiteralPrimaryContext): LiteralPrimaryType => {
    if (!ctx.literal()) {
        throw new Error('値が異常です。LiteralPrimaryContext: ' + ctx.getText());
    }

    const primary = new LiteralVisitor().visit(ctx.literal());

    return {
        type: 'literalPrimary',
        primary: primary,
    };
};

