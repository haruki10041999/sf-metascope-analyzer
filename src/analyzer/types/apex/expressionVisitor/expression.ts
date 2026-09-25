import { ExpressionContext } from '@apexdevtools/apex-parser';

export type ExpressionType = {
    type: 'expression';
    value: string;
};

export const makeExpressionType = (ctx: ExpressionContext): ExpressionType => ({
    type: 'expression',
    value: ctx.getText(),
});

