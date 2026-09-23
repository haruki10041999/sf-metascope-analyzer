import { ThrowStatementContext } from '@apexdevtools/apex-parser';

export type ThrowStatementType = {
    type: 'throw';
    value: string;
};

export const makeThrowStatementType = (ctx: ThrowStatementContext): ThrowStatementType => {
    return {
        type: 'throw',
        value: ctx.expression().getText(),
    };
};
