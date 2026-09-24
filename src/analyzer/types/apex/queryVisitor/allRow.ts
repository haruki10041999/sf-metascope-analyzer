import { AllRowsClauseContext } from '@apexdevtools/apex-parser';

export type AllRowsField = {
    allRows: boolean;
};

export const makeAllRowsField = (ctx: AllRowsClauseContext): AllRowsField => {
    if (ctx.ALL() && ctx.ROWS()) {
        return {
            allRows: true,
        };
    }
    return {
        allRows: false,
    };
};
