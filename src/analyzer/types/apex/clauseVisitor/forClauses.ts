import { ForClausesContext } from '@apexdevtools/apex-parser';

export type ForClausesType = {
    type: 'forClauses';
    for: 'VIEW' | 'UPDATE' | 'REFERENCE';
};

export const makeForClausesType = (ctx: ForClausesContext): ForClausesType => {
    if (ctx.VIEW_list() && ctx.VIEW_list().length > 0) {
        return {
            type: 'forClauses',
            for: 'VIEW',
        };
    }

    if (ctx.UPDATE_list() && ctx.UPDATE_list().length > 0) {
        return {
            type: 'forClauses',
            for: 'UPDATE',
        };
    }

    if (ctx.REFERENCE_list() && ctx.REFERENCE_list().length > 0) {
        return {
            type: 'forClauses',
            for: 'REFERENCE',
        };
    }

    throw new Error('値が異常です。ForClausesContext: ' + ctx.getText());
};
