import { FormalParametersContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from './listVisitor';

export type FormalParametersType = {
    type: 'formalParameters';
    list: Omit<ListType, 'type'>;
};

export const makeFormalParametersType = (ctx: FormalParametersContext): FormalParametersType => {
    const list = new ListVisitor().visit(ctx.formalParameterList());
    return {
        type: 'formalParameters',
        list: list,
    };
};
