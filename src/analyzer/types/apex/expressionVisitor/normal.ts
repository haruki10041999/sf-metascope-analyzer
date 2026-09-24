import { ExpressionContext } from '@apexdevtools/apex-parser';

export type NormalExpressionType = {
    type: 'normal';
    value: string;
};

export const makeNormalType = (ctx: ExpressionContext): NormalExpressionType => ({
    type: 'normal',
    value: ctx.getText(),
});
