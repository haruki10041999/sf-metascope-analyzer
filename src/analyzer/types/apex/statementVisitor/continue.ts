import { ContinueStatementContext } from '@apexdevtools/apex-parser';

export type ContinueStatementType = {
    type: 'continue';
    value: string;
};

export const makeContinueStatementType = (ctx: ContinueStatementContext): ContinueStatementType => {
    return {
        type: 'continue',
        value: ctx.getText(),
    };
};
