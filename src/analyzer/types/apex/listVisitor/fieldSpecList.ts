import { FieldSpecListContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '.';

import { FieldSpecType, makeFieldSpecType } from '../fieldSpec';

export type FieldSpecListType = {
    type: 'fieldSpecList';
    list: FieldSpecType[];
};

export const makeFieldSpecListType = (ctx: FieldSpecListContext): FieldSpecListType => {
    const list: FieldSpecType[] = [];

    list.push(makeFieldSpecType(ctx.fieldSpec()));

    if (ctx.fieldSpecList_list() && ctx.fieldSpecList_list().length > 0) {
        ctx.fieldSpecList_list().forEach((nestedCtx) => {
            const fieldSpecList = new ListVisitor().visit(nestedCtx);
            if (fieldSpecList.type === 'fieldSpecList') {
                list.push(...fieldSpecList.list);
            }
        });
    }

    return {
        type: 'fieldSpecList',
        list: list,
    };
};

