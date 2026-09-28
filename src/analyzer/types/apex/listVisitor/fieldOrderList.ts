import { FieldOrderListContext } from '@apexdevtools/apex-parser';

import { FieldOrderType, makeFieldOrderType } from '../fieldOrder';

export type FieldOrderListType = {
    type: 'fieldOrderList';
    list: FieldOrderType[];
};

export const makeFieldOrderListType = (ctx: FieldOrderListContext): FieldOrderListType => {
    const list = ctx.fieldOrder_list().map((fieldOrderCtx) => {
        const field = makeFieldOrderType(fieldOrderCtx);

        return field;
    });

    return {
        type: 'fieldOrderList',
        list: list,
    };
};

