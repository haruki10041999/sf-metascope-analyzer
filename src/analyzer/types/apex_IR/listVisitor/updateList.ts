import { UpdateListContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '.';
import { ClauseType, ClauseVisitor } from '../clauseVisitor';

export type UpdateListType = {
    type: 'updateList';
    list: ClauseType[];
};

export const makeUpdateListType = (ctx: UpdateListContext): UpdateListType => {
    if (!ctx.updateType()) {
        throw new Error('値が異常です。UpdateListContext: ' + ctx.getText());
    }

    const list: ClauseType[] = [new ClauseVisitor().visit(ctx.updateType())];

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

