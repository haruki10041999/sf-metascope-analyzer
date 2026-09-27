import { UpdateListContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';

import { UpdateTypeType, makeUpdateTypeType } from '../updateType';

export type UpdateListType = {
    type: 'updateList';
    list: Omit<UpdateTypeType, 'type'>[];
};

export const makeUpdateListType = (ctx: UpdateListContext): UpdateListType => {
    const list: Omit<UpdateTypeType, 'type'>[] = [makeUpdateTypeType(ctx.updateType())];

    if (ctx.updateList()) {
        const nested = new ListVisitor().visit(ctx.updateList());

        if (nested.type === 'updateList') {
            list.push(...nested.list);
        }
    }

    return {
        type: 'updateList',
        list: list,
    };
};
