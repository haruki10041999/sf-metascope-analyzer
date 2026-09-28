import { ArgumentsContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';

export type ArgumentsType = {
    type: 'arguments';
    args: ListType | null;
};

export const makeArgumentsType = (ctx: ArgumentsContext): ArgumentsType => {
    if (ctx.expressionList()) {
        const args = new ListVisitor().visit(ctx.expressionList());

        return {
            type: 'arguments',
            args: args,
        };
    }

    return {
        type: 'arguments',
        args: null,
    };
};
