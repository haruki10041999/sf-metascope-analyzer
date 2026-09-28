import { TypeArgumentsContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';

export type TypeArgumentsType = {
    type: 'typeArguments';
    args: ListType | null;
};

export const makeTypeArgumentsType = (ctx: TypeArgumentsContext): TypeArgumentsType => {
    if (ctx.typeList()) {
        const args = new ListVisitor().visit(ctx.typeList());
        return {
            type: 'typeArguments',
            args,
        };
    }

    return {
        type: 'typeArguments',
        args: null,
    };
};
