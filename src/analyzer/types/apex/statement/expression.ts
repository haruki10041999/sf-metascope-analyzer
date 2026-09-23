import { ExpressionStatementContext, ExpressionContext } from '@apexdevtools/apex-parser';

export type ExpressionStatementType = {
    type: 'expression';
    expression: string;
};

export const makeExpressionStatementType = (
    ctx: ExpressionStatementContext,
): ExpressionStatementType => {
    return {
        type: 'expression',
        expression: ctx.expression().getText(),
    };
};
