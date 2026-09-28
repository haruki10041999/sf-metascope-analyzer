import { FormalParametersContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';

export type FormalParametersType = {
    type: 'formalParameters';
    parameter: ListType | null;
};

export const makeFormalParametersType = (ctx: FormalParametersContext): FormalParametersType => {
    if (ctx.formalParameterList()) {
        const list = new ListVisitor().visit(ctx.formalParameterList());
        return {
            type: 'formalParameters',
            parameter: list,
        };
    }

    return {
        type: 'formalParameters',
        parameter: null,
    };
};
