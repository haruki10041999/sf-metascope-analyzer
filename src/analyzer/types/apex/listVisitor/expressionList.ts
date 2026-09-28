import { ExpressionListContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ExpressionListType = {
    type: 'expressionList';
    list: ExpressionType[];
};

export const makeExpressionListType = (ctx: ExpressionListContext): ExpressionListType => {
    const list = ctx.expression_list().map((expressionCtx) => {
        const expression = new ExpressionVisitor().visit(expressionCtx);
        return expression;
    });
    return {
        type: 'expressionList',
        list: list,
    };
};
