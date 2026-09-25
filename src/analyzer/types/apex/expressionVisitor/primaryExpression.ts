import { PrimaryExpressionContext } from '@apexdevtools/apex-parser';

import { PrimaryType, PrimaryVisitor } from '../primaryVisitor';

export type PrimaryExpressionType = {
    type: 'primaryExpression';
    value: Omit<PrimaryType, 'type'>;
};

export const makePrimaryExpressionType = (ctx: PrimaryExpressionContext): PrimaryExpressionType => {
    const { type, ...field } = new PrimaryVisitor().visit(ctx);

    return {
        type: 'primaryExpression',
        value: field,
    };
};

