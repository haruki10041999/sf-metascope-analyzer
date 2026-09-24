import { PrimaryExpressionContext } from '@apexdevtools/apex-parser';

import { PrimaryField, PrimaryVisitor } from './visitor';

export type PrimaryExpression = {
    type: 'primary';
    field: PrimaryField;
};

export const makePrimaryExpression = (ctx: PrimaryExpressionContext): PrimaryExpression => {
    const visitor = new PrimaryVisitor();
    const field = visitor.visit(ctx);

    return {
        type: 'primary',
        field: field,
    };
};
