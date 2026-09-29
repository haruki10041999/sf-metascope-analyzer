import { ForClausesContext } from '@apexdevtools/apex-parser';

export type ForClausesType = {
    type: 'forClauses';
    clause: ('VIEW' | 'UPDATE' | 'REFERENCE')[];
};

export const makeForClausesType = (ctx: ForClausesContext): ForClausesType => {
    if (!ctx.VIEW_list() && !ctx.UPDATE_list() && !ctx.REFERENCE_list()) {
        throw new Error('値が異常です。ForClausesContext: ' + ctx.getText());
    }

    const clause: ('VIEW' | 'UPDATE' | 'REFERENCE')[] = [];
    if (ctx.VIEW_list() && ctx.VIEW_list().length > 0) {
        clause.push(...Array(ctx.VIEW_list().length).fill('VIEW'));
    }

    if (ctx.UPDATE_list() && ctx.UPDATE_list().length > 0) {
        clause.push(...Array(ctx.UPDATE_list().length).fill('UPDATE'));
    }

    if (ctx.REFERENCE_list() && ctx.REFERENCE_list().length > 0) {
        clause.push(...Array(ctx.REFERENCE_list().length).fill('REFERENCE'));
    }

    return {
        type: 'forClauses',
        clause: clause,
    };
};

