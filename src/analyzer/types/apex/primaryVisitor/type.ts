import { TypeRefPrimaryContext } from '@apexdevtools/apex-parser';

import { TypeField, makeTypeField } from '../../type';

export type TypePrimaryType = {
    type: 'type';
    value: TypeField;
};

export const makeTypePrimaryType = (ctx: TypeRefPrimaryContext): TypePrimaryType => {
    return {
        type: 'type',
        value: makeTypeField(ctx.typeRef()),
    };
};
