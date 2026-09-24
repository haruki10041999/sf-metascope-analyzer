import { ReturnStatementContext } from '@apexdevtools/apex-parser';

export type ReturnStatementType = {
    type: 'return';
    value: string;
};

export const makeReturnStatementType = (ctx: ReturnStatementContext): ReturnStatementType => {
    return {
        type: 'return',
        value: ctx.expression().getText(),
    };
};
