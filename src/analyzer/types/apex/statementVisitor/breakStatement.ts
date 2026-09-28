import { BreakStatementContext } from '@apexdevtools/apex-parser';

export type BreakStatementType = {
    type: 'breakStatement';
    statement: string;
};

export const makeBreakStatementType = (ctx: BreakStatementContext): BreakStatementType => {
    return {
        type: 'breakStatement',
        statement: ctx.BREAK().getText(),
    };
};

