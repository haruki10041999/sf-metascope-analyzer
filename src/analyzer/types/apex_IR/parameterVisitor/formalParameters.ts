import { FormalParametersContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';

export type FormalParametersType = {
    type: 'formalParameters';
    parameter: ListType | [];
};

export const makeFormalParametersType = (ctx: FormalParametersContext): FormalParametersType => {
    if ((!ctx.LPAREN() && ctx.RPAREN()) || (!ctx.RPAREN() && ctx.LPAREN())) {
        throw new Error('値が異常です。FormalParametersContext: ' + ctx.getText());
    }
    if (!ctx.formalParameterList()) {
        return {
            type: 'formalParameters',
            parameter: [],
        };
    }

    const list = new ListVisitor().visit(ctx.formalParameterList());
    return {
        type: 'formalParameters',
        parameter: list,
    };
};
