import { ContinueStatementContext } from '@apexdevtools/apex-parser';

export type ContinueStatementType = {
    type: 'continueStatement';
    value: string;
};

export const makeContinueStatementType = (ctx: ContinueStatementContext): ContinueStatementType => {
    return {
        type: 'continueStatement',
        value: ctx.getText(),
    };
};

