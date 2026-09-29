import { AllRowsClauseContext } from '@apexdevtools/apex-parser';

export type AllRowClauseType = {
    type: 'allRow';
    clause: string;
};

export const makeAllRowClauseType = (ctx: AllRowsClauseContext) => {
    if (!ctx.ALL() || !ctx.ROWS()) {
        throw new Error('値が異常です。AllRowsClauseContext: ' + ctx.getText());
    }

    return {
        type: 'allRow',
        clause: ctx.ALL().getText() + ' ' + ctx.ROWS().getText(),
    };
};

