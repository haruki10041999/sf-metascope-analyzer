import { BreakStatementContext } from '@apexdevtools/apex-parser';

export type BreakStatementType = {
    type: 'breakStatement';
    value: string;
};

export const makeBreakStatementType = (ctx: BreakStatementContext): BreakStatementType => {
    return {
        type: 'breakStatement',
        value: ctx.getText(),
    };
};

