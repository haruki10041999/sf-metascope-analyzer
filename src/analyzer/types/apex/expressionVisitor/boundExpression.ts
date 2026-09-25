import { BoundExpressionContext } from '@apexdevtools/apex-parser';

export type BoundExpressionType = {
    type: 'boundExpression';
    value: string;
};

export function makeBoundExpressionType(ctx: BoundExpressionContext): BoundExpressionType {
    return {
        type: 'boundExpression',
        value: ctx.getText(),
    };
}
