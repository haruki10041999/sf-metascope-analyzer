import { ForUpdateContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from './listVisitor';

export type ForUpdateType = {
    type: 'forUpdate';
    update: Omit<ListType, 'type'>;
};

export const makeForUpdateType = (ctx: ForUpdateContext): ForUpdateType => {
    const { type, ...update } = new ListVisitor().visit(ctx.expressionList());
    return {
        type: 'forUpdate',
        update: update,
    };
};
