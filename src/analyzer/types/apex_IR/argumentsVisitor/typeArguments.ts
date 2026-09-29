import { TypeArgumentsContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';

export type TypeArgumentsType = {
    type: 'typeArguments';
    args: ListType;
};

export const makeTypeArgumentsType = (ctx: TypeArgumentsContext): TypeArgumentsType => {
    if (!ctx.typeList() && (!ctx.LT() || !ctx.GT())) {
        throw new Error('値が異常です。TypeArgumentsContext: ' + ctx.getText());
    }

    const args = new ListVisitor().visit(ctx.typeList());
    return {
        type: 'typeArguments',
        args,
    };
};
