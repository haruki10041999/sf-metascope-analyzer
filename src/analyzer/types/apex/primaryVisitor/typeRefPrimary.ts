import { TypeRefPrimaryContext } from '@apexdevtools/apex-parser';

import { TypeRefType, makeTypeRefType } from '../typeRef';

export type TypeRefPrimaryType = {
    type: 'typeRefPrimary';
    value: Omit<TypeRefType, 'type'>;
};

export const makeTypeRefPrimaryType = (ctx: TypeRefPrimaryContext): TypeRefPrimaryType => {
    const { type, ...value } = makeTypeRefType(ctx.typeRef());

    return {
        type: 'typeRefPrimary',
        value: value,
    };
};
