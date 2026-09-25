import { ElementValueContext } from '@apexdevtools/apex-parser';

import { LiteralType, LiteralVisitor } from '../literalVisitor';

export type ElementValueType = {
    type: 'elementValue';
    value: Omit<LiteralType, 'type'>;
};

export const makeElementValueType = (ctx: ElementValueContext): ElementValueType => {
    const { type, ...value } = new LiteralVisitor().visit(ctx.literal());
    return {
        type: 'elementValue',
        value: value,
    };
};
