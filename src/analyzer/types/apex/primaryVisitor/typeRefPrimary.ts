import { TypeRefPrimaryContext } from '@apexdevtools/apex-parser';

import { TypeField, makeTypeField } from '../type';

export type TypeRefPrimaryType = {
    type: 'typeRefPrimary';
    value: TypeField;
};

export const makeTypeRefPrimaryType = (ctx: TypeRefPrimaryContext): TypeRefPrimaryType => {
    return {
        type: 'typeRefPrimary',
        value: makeTypeField(ctx.typeRef()),
    };
};

