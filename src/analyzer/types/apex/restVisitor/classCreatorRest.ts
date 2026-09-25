import { ClassCreatorRestContext } from '@apexdevtools/apex-parser';

import { ArgumentsType, ArgumentsVisitor } from '../argumentsVisitor';

export type ClassCreatorRestType = {
    type: 'classCreatorRest';
    params: Omit<ArgumentsType, 'type'>;
};

export const makeClassCreatorRestType = (ctx: ClassCreatorRestContext): ClassCreatorRestType => {
    const { type, ...params } = new ArgumentsVisitor().visit(ctx.arguments());

    return {
        type: 'classCreatorRest',
        params: params,
    };
};
