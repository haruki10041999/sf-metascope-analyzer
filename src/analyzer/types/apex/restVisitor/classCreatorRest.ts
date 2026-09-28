import { ClassCreatorRestContext } from '@apexdevtools/apex-parser';

import { ArgumentsType, ArgumentsVisitor } from '../argumentsVisitor';

export type ClassCreatorRestType = {
    type: 'classCreatorRest';
    rest: ArgumentsType;
};

export const makeClassCreatorRestType = (ctx: ClassCreatorRestContext): ClassCreatorRestType => {
    const rest = new ArgumentsVisitor().visit(ctx.arguments());

    return {
        type: 'classCreatorRest',
        rest: rest,
    };
};
