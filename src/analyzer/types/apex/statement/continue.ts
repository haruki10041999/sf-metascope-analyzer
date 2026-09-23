import { ContinueStatementContext } from '@apexdevtools/apex-parser';

export type ContinueStatementType = {
    type: 'continue';
    isContinue: boolean;
};

export const makeContinueStatementType = (ctx: ContinueStatementContext): ContinueStatementType => {
    return {
        type: 'continue',
        isContinue: ctx.CONTINUE() ? true : false,
    };
};
