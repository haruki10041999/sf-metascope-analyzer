import { FieldOrderListContext } from '@apexdevtools/apex-parser';

import { ClauseType, ClauseVisitor } from '../clauseVisitor';

export type FieldOrderListType = {
    type: 'fieldOrderList';
    list: ClauseType[];
};

export const makeFieldOrderListType = (ctx: FieldOrderListContext): FieldOrderListType => {
    if (!ctx.fieldOrder_list() || ctx.fieldOrder_list().length === 0) {
        throw new Error('値が異常です。FieldOrderListContext: ' + ctx.getText());
    }

    const list = ctx.fieldOrder_list().map((fieldOrderCtx) => {
        const field = new ClauseVisitor().visitFieldOrder(fieldOrderCtx);

        return field;
    });

    return {
        type: 'fieldOrderList',
        list: list,
    };
};

