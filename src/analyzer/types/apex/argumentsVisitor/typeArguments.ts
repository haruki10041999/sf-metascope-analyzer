import { TypeArgumentsContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';

export type TypeArgumentsType = {
    type: 'typeArguments';
    args: Omit<ListType, 'type'>;
};

export const makeTypeArgumentsType = (ctx: TypeArgumentsContext): TypeArgumentsType => {
    return {
        type: 'typeArguments',
        args: new ListVisitor().visit(ctx.typeList()),
    };
};
