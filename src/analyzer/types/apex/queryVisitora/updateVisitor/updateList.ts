import { UpdateListContext, UpdateTypeContext } from '@apexdevtools/apex-parser';

import { UpdateType, UpdateVisitor } from '.';

export type UpdateListType = {
    type: 'updateList';
    modeList: Omit<UpdateType, 'type'>[];
};

export const makeUpdateListType = (ctx: UpdateListContext): UpdateListType => {
    const modeList: Omit<UpdateType, 'type'>[] = [new UpdateVisitor().visit(ctx.updateType())];

    if (ctx.updateList()) {
        const nested = new UpdateVisitor().visit(ctx.updateList());

        if (nested.type === 'updateList') {
            modeList.push(...nested.modeList);
        }
    }

    return {
        type: 'updateList',
        modeList: modeList,
    };
};

