import { FieldGroupByListContext } from '@apexdevtools/apex-parser';

import { FieldGroupByType, makeFieldGroupByType } from '../fieldGroupBy';

export type FieldGroupByListType = {
    type: 'fieldGroupByList';
    list: FieldGroupByType[];
};

export const makeFieldGroupByListType = (ctx: FieldGroupByListContext): FieldGroupByListType => {
    const list = ctx.fieldGroupBy_list().map((fieldGroupByCtx) => {
        const value = makeFieldGroupByType(fieldGroupByCtx);
        return value;
    });

    return {
        type: 'fieldGroupByList',
        list: list,
    };
};

