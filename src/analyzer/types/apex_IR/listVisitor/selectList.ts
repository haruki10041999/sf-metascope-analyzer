import { SelectListContext } from '@apexdevtools/apex-parser';

import { EntryType, EntryVisitor } from '../entryVisitor';

export type SelectListType = {
    type: 'selectList';
    list: EntryType[];
};

export const makeSelectListType = (ctx: SelectListContext): SelectListType => {
    if (!ctx.selectEntry_list() || ctx.selectEntry_list().length === 0) {
        throw new Error('値が異常です。SelectListContext: ' + ctx.getText());
    }

    const list = ctx.selectEntry_list().map((selectEntryCtx) => {
        const entry = new EntryVisitor().visit(selectEntryCtx);
        return entry;
    });

    return {
        type: 'selectList',
        list: list,
    };
};

