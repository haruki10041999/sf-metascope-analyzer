import { ExpressionContext } from '@apexdevtools/apex-parser';

export type ExpressionType = {
    type: 'expression';
    expression: string;
};

export const makeExpressionType = (ctx: ExpressionContext): ExpressionType => {
    if (!ctx) {
        throw new Error('値が異常です。ExpressionContext: ' + ctx);
    }

    return {
        type: 'expression',
        expression: ctx.getText(),
    };
};

