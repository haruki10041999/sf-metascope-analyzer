import { VariableDeclaratorsContext } from '@apexdevtools/apex-parser';

import { VariableType, VariableVisitor } from '.';

export type VariableDeclaratorsType = {
    type: 'variableDeclarators';
    variable: VariableType[];
};

export const makeVariableDeclaratorsType = (
    ctx: VariableDeclaratorsContext,
): VariableDeclaratorsType => {
    if (!ctx.variableDeclarator_list() || ctx.variableDeclarator_list().length === 0) {
        throw new Error('値が異常です。VariableDeclaratorsContext: ' + ctx.getText());
    }

    return {
        type: 'variableDeclarators',
        variable: ctx.variableDeclarator_list().map((vd) => {
            const variant = new VariableVisitor().visit(vd);
            return variant;
        }),
    };
};
