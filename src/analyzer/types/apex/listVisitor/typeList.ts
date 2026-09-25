import { TypeListContext } from '@apexdevtools/apex-parser';

import { TypeRefType, makeTypeRefType } from '../typeRef';

export type TypeListType = {
    type: 'typeList';
    list: Omit<TypeRefType, 'type'>[];
};

export const makeTypeListType = (ctx: TypeListContext): TypeListType => {
    return {
        type: 'typeList',
        list: ctx.typeRef_list().map((typeRefCtx) => {
            const { type, ...nest } = makeTypeRefType(typeRefCtx);
            return nest;
        }),
    };
};
