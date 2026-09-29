import { BreakStatementContext } from '@apexdevtools/apex-parser';

export type BreakStatementType = {
    type: 'breakStatement';
    statement: string;
};

export const makeBreakStatementType = (ctx: BreakStatementContext): BreakStatementType => {
    if (!ctx.BREAK()) {
        throw new Error('値が異常です。BreakStatementContext: ' + ctx.getText());
    }

    return {
        type: 'breakStatement',
        statement: ctx.BREAK().getText(),
    };
};

