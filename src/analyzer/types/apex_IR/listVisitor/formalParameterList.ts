import { FormalParameterListContext } from '@apexdevtools/apex-parser';

import { ParameterType, ParameterVisitor } from '../parameterVisitor';

export type FormalParameterListType = {
    type: 'formalParameterList';
    list: ParameterType[];
};

export const makeFormalParameterListType = (
    ctx: FormalParameterListContext,
): FormalParameterListType => {
    if (!ctx.formalParameter_list() || ctx.formalParameter_list().length === 0) {
        throw new Error('値が異常です。FormalParameterListContext: ' + ctx.getText());
    }

    return {
        type: 'formalParameterList',
        list: ctx.formalParameter_list().map((formalParameterCtx) => {
            const parameter = new ParameterVisitor().visit(formalParameterCtx);
            return parameter;
        }),
    };
};
