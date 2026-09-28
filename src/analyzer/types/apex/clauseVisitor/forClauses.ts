import { ForClausesContext } from '@apexdevtools/apex-parser';

export type ForClausesType = {
    type: 'forClauses';
    clause: 'VIEW' | 'UPDATE' | 'REFERENCE';
};

export const makeForClausesType = (ctx: ForClausesContext): ForClausesType => {
    if (ctx.VIEW_list() && ctx.VIEW_list().length > 0) {
        return {
            type: 'forClauses',
            clause: 'VIEW',
        };
    }

    if (ctx.UPDATE_list() && ctx.UPDATE_list().length > 0) {
        return {
            type: 'forClauses',
            clause: 'UPDATE',
        };
    }

    if (ctx.REFERENCE_list() && ctx.REFERENCE_list().length > 0) {
        return {
            type: 'forClauses',
            clause: 'REFERENCE',
        };
    }

    throw new Error('値が異常です。ForClausesContext: ' + ctx.getText());
};

