import { ArgumentsContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';

export type ArgumentsType = {
    type: 'arguments';
    args: ListType | [];
};

export const makeArgumentsType = (ctx: ArgumentsContext): ArgumentsType => {
    if ((!ctx.LPAREN() && ctx.RPAREN()) || (!ctx.RPAREN() && ctx.LPAREN())) {
        throw new Error('値が異常です。ArgumentsContext: ' + ctx.getText());
    }

    if (!ctx.expressionList()) {
        return {
            type: 'arguments',
            args: [],
        };
    }

    const args = new ListVisitor().visit(ctx.expressionList());

    return {
        type: 'arguments',
        args: args,
    };
};
