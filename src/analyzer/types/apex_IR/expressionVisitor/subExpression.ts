import { SubExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type SubExpressionType = {
    type: 'subExpression';
    expression: ExpressionType;
};

export const makeSubExpressionType = (ctx: SubExpressionContext): SubExpressionType => {
    if (!ctx.expression()) {
        throw new Error('値が異常です。SubExpressionContext: ' + ctx.getText());
    }

    const expression = new ExpressionVisitor().visit(ctx.expression());

    return {
        type: 'subExpression',
        expression: expression,
    };
};

