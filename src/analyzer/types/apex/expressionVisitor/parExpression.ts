import { ParExpressionContext } from '@apexdevtools/apex-parser';

export type ParExpressionType = {
    type: 'ParExpression';
    value: string;
};

export const makeParExpressionType = (ctx: ParExpressionContext): ParExpressionType => {
    return {
        type: 'ParExpression',
        value: ctx.getText(),
    };
};
