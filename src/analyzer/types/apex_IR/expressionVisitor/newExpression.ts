import { NewExpressionContext } from '@apexdevtools/apex-parser';

import { RestType, RestVisitor } from '../restVisitor';

export type NewExpressionType = {
    type: 'newExpression';
    expression: RestType;
};

export const makeNewExpressionType = (ctx: NewExpressionContext): NewExpressionType => {
    if (!ctx.creator()) {
        throw new Error('値が異常です。NewExpressionContext: ' + ctx.getText());
    }

    const expression = new RestVisitor().visit(ctx.creator());

    return {
        type: 'newExpression',
        expression: expression,
    };
};

