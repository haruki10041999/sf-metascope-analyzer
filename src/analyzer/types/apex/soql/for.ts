import { ForClausesContext } from '@apexdevtools/apex-parser';

export type ForField = {
    type: 'VIEW' | 'UPDATE' | 'REFERENCE' | 'NONE';
};

export const makeForField = (ctx: ForClausesContext): ForField => {
    let type: 'VIEW' | 'UPDATE' | 'REFERENCE' | 'NONE' = 'NONE';

    if (ctx.VIEW_list().length > 0) {
        type = 'VIEW';
    }

    if (ctx.UPDATE_list()) {
        type = 'UPDATE';
    }

    if (ctx.REFERENCE_list().length > 0) {
        type = 'REFERENCE';
    }

    return {
        type: type,
    };
};
