import { FieldSpecListContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '.';

import { FieldSpecType, makeFieldSpecType } from '../fieldSpec';

export type FieldSpecListType = {
    type: 'fieldSpecList';
    list: Omit<FieldSpecType, 'type'>[];
};

export const makeFieldSpecListType = (ctx: FieldSpecListContext): FieldSpecListType => {
    const list: Omit<FieldSpecType, 'type'>[] = [];

    list.push(makeFieldSpecType(ctx.fieldSpec()));

    if (ctx.fieldSpecList_list() && ctx.fieldSpecList_list().length > 0) {
        ctx.fieldSpecList_list().forEach((nestedCtx) => {
            const { type, list: fieldSpecList } = new ListVisitor().visit(nestedCtx);
            if (type === 'fieldSpecList') {
                list.push(...fieldSpecList);
            }
        });
    }

    return {
        type: 'fieldSpecList',
        list: list,
    };
};
