import { TypeRefPrimaryContext } from '@apexdevtools/apex-parser';

import { TypeType, TypeVisitor } from '../typeVisitor';

export type TypeRefPrimaryType = {
    type: 'typeRefPrimary';
    primary: TypeType;
};

export const makeTypeRefPrimaryType = (ctx: TypeRefPrimaryContext): TypeRefPrimaryType => {
    const primary = new TypeVisitor().visit(ctx.typeRef());

    return {
        type: 'typeRefPrimary',
        primary: primary,
    };
};

