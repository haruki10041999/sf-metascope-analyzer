import { PrimaryExpressionContext } from '@apexdevtools/apex-parser';

import { PrimaryField, PrimaryVisitor } from './visitor';

export type PrimaryExpression = {
    type: 'primary';
    field: PrimaryField;
};

export const makePrimaryExpression = (ctx: PrimaryExpressionContext): PrimaryExpression => {
    const field = new PrimaryVisitor().visit(ctx);

    return {
        type: 'primary',
        field: field,
    };
};
