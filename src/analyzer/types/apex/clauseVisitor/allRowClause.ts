import { AllRowsClauseContext } from '@apexdevtools/apex-parser';

export type AllRowClauseType = {
    type: 'allRow';
    value: string;
};

export const makeAllRowClauseType = (ctx: AllRowsClauseContext) => {
    return {
        type: 'allRow',
        value: ctx.getText(),
    };
};
