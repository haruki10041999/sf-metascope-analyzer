import { PrimaryExpressionContext } from '@apexdevtools/apex-parser';

import { PrimaryType, PrimaryVisitor } from '../primaryVisitor';

export type PrimaryExpressionType = {
    type: 'primaryExpression';
    expression: PrimaryType;
};

export const makePrimaryExpressionType = (ctx: PrimaryExpressionContext): PrimaryExpressionType => {
    const field = new PrimaryVisitor().visit(ctx);

    return {
        type: 'primaryExpression',
        expression: field,
    };
};

