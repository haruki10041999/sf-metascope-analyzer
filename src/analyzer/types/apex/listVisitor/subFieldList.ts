import { SubFieldListContext } from '@apexdevtools/apex-parser';

import { EntryType, EntryVisitor } from '../entryVisitor';

export type SubFieldListType = {
    type: 'subFieldList';
    list: EntryType[];
};

export const makeSubFieldListType = (ctx: SubFieldListContext): SubFieldListType => {
    const list = ctx.subFieldEntry_list().map((subFieldEntryCtx) => {
        const entry = new EntryVisitor().visit(subFieldEntryCtx);
        return entry;
    });

    return {
        type: 'subFieldList',
        list: list,
    };
};

