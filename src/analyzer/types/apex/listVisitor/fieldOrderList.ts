import { FieldOrderListContext } from '@apexdevtools/apex-parser';

import { ClauseType, ClauseVisitor } from '../clauseVisitor';

export type FieldOrderListType = {
    type: 'fieldOrderList';
    list: ClauseType[];
};

export const makeFieldOrderListType = (ctx: FieldOrderListContext): FieldOrderListType => {
    const list = ctx.fieldOrder_list().map((fieldOrderCtx) => {
        const field = new ClauseVisitor().visitFieldOrder(fieldOrderCtx);

        return field;
    });

    return {
        type: 'fieldOrderList',
        list: list,
    };
};

