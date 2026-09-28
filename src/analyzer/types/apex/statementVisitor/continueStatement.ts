import { ContinueStatementContext } from '@apexdevtools/apex-parser';

export type ContinueStatementType = {
    type: 'continueStatement';
    statement: string;
};

export const makeContinueStatementType = (ctx: ContinueStatementContext): ContinueStatementType => {
    return {
        type: 'continueStatement',
        statement: ctx.getText(),
    };
};

