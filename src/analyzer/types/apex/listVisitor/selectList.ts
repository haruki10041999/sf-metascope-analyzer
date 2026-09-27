import { SelectListContext } from '@apexdevtools/apex-parser';

import { EntryType, EntryVisitor } from '../entryVisitor';

export type SelectListType = {
    type: 'selectList';
    list: Omit<EntryType, 'type'>[];
};

export const makeSelectListType = (ctx: SelectListContext): SelectListType => {
    const list = ctx.selectEntry_list().map((selectEntryCtx) => {
        const { type, ...entry } = new EntryVisitor().visit(selectEntryCtx);
        return entry;
    });

    return {
        type: 'selectList',
        list: list,
    };
};
