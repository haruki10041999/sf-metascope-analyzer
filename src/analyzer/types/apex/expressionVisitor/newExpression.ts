import { NewExpressionContext } from '@apexdevtools/apex-parser';

import { RestType, RestVisitor } from '../restVisitor';

export type NewExpressionType = {
    type: 'newExpression';
    expression: RestType;
};

export const makeNewExpressionType = (ctx: NewExpressionContext): NewExpressionType => {
    const expression = new RestVisitor().visit(ctx.creator());

    return {
        type: 'newExpression',
        expression: expression,
    };
};

