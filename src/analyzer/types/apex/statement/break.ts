import { BreakStatementContext } from '@apexdevtools/apex-parser';

export type BreakStatementType = {
    type: 'break';
    isBreak: boolean;
};

export const makeBreakStatementType = (ctx: BreakStatementContext): BreakStatementType => {
    return {
        type: 'break',
        isBreak: ctx.BREAK() ? true : false,
    };
};
