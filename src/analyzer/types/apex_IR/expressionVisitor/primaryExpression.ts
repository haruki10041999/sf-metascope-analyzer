import { PrimaryExpressionContext } from '@apexdevtools/apex-parser';

import { PrimaryType, PrimaryVisitor } from '../primaryVisitor';

export type PrimaryExpressionType = {
    type: 'primaryExpression';
    expression: PrimaryType;
};

export const makePrimaryExpressionType = (ctx: PrimaryExpressionContext): PrimaryExpressionType => {
    if (!ctx.primary()) {
        throw new Error('値が異常です。PrimaryExpressionContext: ' + ctx.getText());
    }

    const field = new PrimaryVisitor().visit(ctx.primary());

    return {
        type: 'primaryExpression',
        expression: field,
    };
};

