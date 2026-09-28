import { FormalParametersContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';

export type FormalParametersType = {
    type: 'formalParameters';
    parameter: ListType;
};

export const makeFormalParametersType = (ctx: FormalParametersContext): FormalParametersType => {
    const list = new ListVisitor().visit(ctx.formalParameterList());
    return {
        type: 'formalParameters',
        parameter: list,
    };
};
