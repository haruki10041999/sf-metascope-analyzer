import { VariableDeclaratorsContext } from '@apexdevtools/apex-parser';

import { VariableDeclaratorType, makeVariableDeclaratorType } from './variableDeclarator';

export type VariableDeclaratorsType = {
    type: 'variableDeclarators';
    variants: Omit<VariableDeclaratorType, 'type'>[];
};

export const makeVariableDeclaratorsType = (
    ctx: VariableDeclaratorsContext,
): VariableDeclaratorsType => {
    return {
        type: 'variableDeclarators',
        variants: ctx.variableDeclarator_list().map((vd) => {
            const { type, ...variant } = makeVariableDeclaratorType(vd);
            return variant;
        }),
    };
};
