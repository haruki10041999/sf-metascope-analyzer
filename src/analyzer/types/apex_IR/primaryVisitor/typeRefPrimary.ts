import { TypeRefPrimaryContext } from '@apexdevtools/apex-parser';

import { TypeType, TypeVisitor } from '../typeVisitor';

export type TypeRefPrimaryType = {
    type: 'typeRefPrimary';
    primary: TypeType;
};

export const makeTypeRefPrimaryType = (ctx: TypeRefPrimaryContext): TypeRefPrimaryType => {
    if (!ctx.typeRef()) {
        throw new Error('値が異常です。TypeRefPrimaryContext: ' + ctx.getText());
    }

    const primary = new TypeVisitor().visit(ctx.typeRef());

    return {
        type: 'typeRefPrimary',
        primary: primary,
    };
};

