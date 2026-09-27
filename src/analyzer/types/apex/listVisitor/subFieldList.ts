import { SubFieldListContext } from '@apexdevtools/apex-parser';

import { EntryType, EntryVisitor } from '../entryVisitor';

export type SubFieldListType = {
    type: 'subFieldList';
    list: Omit<EntryType, 'type'>[];
};

export const makeSubFieldListType = (ctx: SubFieldListContext): SubFieldListType => {
    const list = ctx.subFieldEntry_list().map((subFieldEntryCtx) => {
        const { type, ...entry } = new EntryVisitor().visit(subFieldEntryCtx);
        return entry;
    });

    return {
        type: 'subFieldList',
        list: list,
    };
};
