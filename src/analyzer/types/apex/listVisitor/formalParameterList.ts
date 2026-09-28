import { FormalParameterListContext } from '@apexdevtools/apex-parser';

import { ParameterType, ParameterVisitor } from '../parameterVisitor';

export type FormalParameterListType = {
    type: 'formalParameterList';
    list: ParameterType[];
};

export const makeFormalParameterListType = (
    ctx: FormalParameterListContext,
): FormalParameterListType => ({
    type: 'formalParameterList',
    list: ctx.formalParameter_list().map((formalParameterCtx) => {
        const parameter = new ParameterVisitor().visit(formalParameterCtx);
        return parameter;
    }),
});
