import { ForUpdateContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';

export type ForUpdateType = {
    type: 'forUpdate';
    update: ListType;
};

export const makeForUpdateType = (ctx: ForUpdateContext): ForUpdateType => {
    const update = new ListVisitor().visit(ctx.expressionList());
    return {
        type: 'forUpdate',
        update: update,
    };
};
