import { ForClausesContext } from '@apexdevtools/apex-parser';

export type ForClauseType = {
    type: 'forClause';
    for: 'VIEW' | 'UPDATE' | 'REFERENCE';
};

export const makeForClauseType = (ctx: ForClausesContext): ForClauseType => {
    if (ctx.VIEW_list() && ctx.VIEW_list().length > 0) {
        return {
            type: 'forClause',
            for: 'VIEW',
        };
    }

    if (ctx.UPDATE_list() && ctx.UPDATE_list().length > 0) {
        return {
            type: 'forClause',
            for: 'UPDATE',
        };
    }

    if (ctx.REFERENCE_list() && ctx.REFERENCE_list().length > 0) {
        return {
            type: 'forClause',
            for: 'REFERENCE',
        };
    }

    throw new Error('値が異常です。ForClauseContext: ' + ctx.getText());
};
