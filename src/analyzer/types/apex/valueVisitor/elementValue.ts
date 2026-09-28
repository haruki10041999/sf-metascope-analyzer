import { ElementValueContext } from '@apexdevtools/apex-parser';

import { LiteralType, LiteralVisitor } from '../literalVisitor';

export type ElementValueType = {
    type: 'elementValue';
    value: LiteralType;
};

export const makeElementValueType = (ctx: ElementValueContext): ElementValueType => {
    const value = new LiteralVisitor().visit(ctx.literal());
    return {
        type: 'elementValue',
        value: value,
    };
};
