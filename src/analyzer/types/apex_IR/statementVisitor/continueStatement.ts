import { ContinueStatementContext } from '@apexdevtools/apex-parser';

export type ContinueStatementType = {
    type: 'continueStatement';
    statement: string;
};

export const makeContinueStatementType = (ctx: ContinueStatementContext): ContinueStatementType => {
    if (!ctx.CONTINUE()) {
        throw new Error('値が異常です。ContinueStatementContext: ' + ctx.getText());
    }

    return {
        type: 'continueStatement',
        statement: ctx.CONTINUE().getText(),
    };
};

