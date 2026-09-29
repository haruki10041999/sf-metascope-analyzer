import { SoqlPrimaryContext } from '@apexdevtools/apex-parser';

import { LiteralType, LiteralVisitor } from '../literalVisitor';

export type SoqlPrimaryType = {
    type: 'soqlPrimary';
    primary: LiteralType;
};

export const makeSoqlPrimaryType = (ctx: SoqlPrimaryContext): SoqlPrimaryType => {
    if (!ctx.soqlLiteral()) {
        throw new Error('値が異常です。SoqlPrimaryContext: ' + ctx.getText());
    }

    const primary = new LiteralVisitor().visit(ctx.soqlLiteral());

    return {
        type: 'soqlPrimary',
        primary: primary,
    };
};

