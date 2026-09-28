import { VariableDeclaratorsContext } from '@apexdevtools/apex-parser';

import { VariableType, VariableVisitor } from '../variableVisitor';

export type VariableDeclaratorsType = {
    type: 'variableDeclarators';
    variable: VariableType[];
};

export const makeVariableDeclaratorsType = (
    ctx: VariableDeclaratorsContext,
): VariableDeclaratorsType => {
    return {
        type: 'variableDeclarators',
        variable: ctx.variableDeclarator_list().map((vd) => {
            const variant = new VariableVisitor().visit(vd);
            return variant;
        }),
    };
};
