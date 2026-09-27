import { SoslPrimaryContext } from '@apexdevtools/apex-parser';

import { LiteralType, LiteralVisitor } from '../literalVisitor';

export type SoslPrimaryType = {
    type: 'soslPrimary';
    value: Omit<LiteralType, 'type'>;
};

export const makeSoslPrimaryType = (ctx: SoslPrimaryContext): SoslPrimaryType => {
    const { type, ...value } = new LiteralVisitor().visit(ctx.soslLiteral());

    return {
        type: 'soslPrimary',
        value: value,
    };
};
