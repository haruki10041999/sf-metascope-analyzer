import { ExpressionListContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ExpressionListType = {
    type: 'expressionList';
    list: Omit<ExpressionType, 'type'>[];
};

export const makeExpressionListType = (ctx: ExpressionListContext): ExpressionListType => {
    const lists = ctx.expression_list().map((expressionCtx) => {
        const expression = new ExpressionVisitor().visit(expressionCtx);
        const { type, ...list } = expression;
        return list;
    });
    return {
        type: 'expressionList',
        list: lists,
    };
};
