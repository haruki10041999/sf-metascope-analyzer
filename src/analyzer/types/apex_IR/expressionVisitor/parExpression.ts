import { ParExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type ParExpressionType = {
    type: 'parExpression';
    expression: ExpressionType;
};

export const makeParExpressionType = (ctx: ParExpressionContext): ParExpressionType => {
    if (!ctx.expression()) {
        throw new Error('値が異常です。ParExpressionContext: ' + ctx.getText());
    }

    return {
        type: 'parExpression',
        expression: new ExpressionVisitor().visit(ctx.expression()),
    };
};
