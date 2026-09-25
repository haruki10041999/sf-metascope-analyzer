import { FormalParameterListContext } from '@apexdevtools/apex-parser';

import { ParameterType, ParameterVisitor } from '../parameterVisitor';

export type FormalParameterListType = {
    type: 'formalParameterList';
    list: Omit<ParameterType, 'type'>[];
};

export const makeFormalParameterListType = (
    ctx: FormalParameterListContext,
): FormalParameterListType => ({
    type: 'formalParameterList',
    list: ctx.formalParameter_list().map((formalParameterCtx) => {
        const { type, ...list } = new ParameterVisitor().visit(formalParameterCtx);
        return list;
    }),
});
