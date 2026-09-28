import { ExpressionContext } from '@apexdevtools/apex-parser';

export type ExpressionType = {
    type: 'expression';
    expression: string;
};

export const makeExpressionType = (ctx: ExpressionContext): ExpressionType => ({
    type: 'expression',
    expression: ctx.getText(),
});

