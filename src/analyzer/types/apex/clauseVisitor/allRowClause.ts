import { AllRowsClauseContext } from '@apexdevtools/apex-parser';

export type AllRowClauseType = {
    type: 'allRow';
    clause: string;
};

export const makeAllRowClauseType = (ctx: AllRowsClauseContext) => {
    return {
        type: 'allRow',
        clause: ctx.getText(),
    };
};

