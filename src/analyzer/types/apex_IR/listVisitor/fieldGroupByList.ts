import { FieldGroupByListContext } from '@apexdevtools/apex-parser';

import { ClauseType, ClauseVisitor } from '../clauseVisitor';

export type FieldGroupByListType = {
    type: 'fieldGroupByList';
    list: ClauseType[];
};

export const makeFieldGroupByListType = (ctx: FieldGroupByListContext): FieldGroupByListType => {
    if (!ctx.fieldGroupBy_list() || ctx.fieldGroupBy_list().length === 0) {
        throw new Error('値が異常です。FieldGroupByListContext: ' + ctx.getText());
    }

    const list = ctx.fieldGroupBy_list().map((fieldGroupByCtx) => {
        const value = new ClauseVisitor().visit(fieldGroupByCtx);
        return value;
    });

    return {
        type: 'fieldGroupByList',
        list: list,
    };
};

