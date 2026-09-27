import { FieldOrderListContext } from '@apexdevtools/apex-parser';

import { FieldOrderType, makeFieldOrderType } from '../fieldOrder';

export type FieldOrderListType = {
    type: 'fieldOrderList';
    list: Omit<FieldOrderType, 'type'>[];
};

export const makeFieldOrderListType = (ctx: FieldOrderListContext): FieldOrderListType => {
    const list = ctx.fieldOrder_list().map((fieldOrderCtx) => {
        const { type, ...field } = makeFieldOrderType(fieldOrderCtx);

        return field;
    });

    return {
        type: 'fieldOrderList',
        list: list,
    };
};
