import { ArgumentsContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';

export type ArgumentsType = {
    type: 'arguments';
    args: ListType;
};

export const makeArgumentsType = (ctx: ArgumentsContext): ArgumentsType => {
    const args = new ListVisitor().visit(ctx.expressionList());

    return {
        type: 'arguments',
        args: args,
    };
};
