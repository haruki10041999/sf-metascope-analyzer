import { SubFieldListContext } from '@apexdevtools/apex-parser';

import { EntryType, EntryVisitor } from '../entryVisitor';

export type SubFieldListType = {
    type: 'subFieldList';
    list: EntryType[];
};

export const makeSubFieldListType = (ctx: SubFieldListContext): SubFieldListType => {
    if (!ctx.subFieldEntry_list() || ctx.subFieldEntry_list().length === 0) {
        throw new Error('値が異常です。SubFieldListContext: ' + ctx.getText());
    }

    const list = ctx.subFieldEntry_list().map((subFieldEntryCtx) => {
        const entry = new EntryVisitor().visit(subFieldEntryCtx);
        return entry;
    });

    return {
        type: 'subFieldList',
        list: list,
    };
};

