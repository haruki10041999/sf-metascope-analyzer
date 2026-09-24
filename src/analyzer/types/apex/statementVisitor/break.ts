import { BreakStatementContext } from '@apexdevtools/apex-parser';

export type BreakStatementType = {
    type: 'break';
    value: string;
};

export const makeBreakStatementType = (ctx: BreakStatementContext): BreakStatementType => {
    return {
        type: 'break',
        value: ctx.getText(),
    };
};
