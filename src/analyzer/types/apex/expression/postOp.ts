import { PostOpExpressionContext } from '@apexdevtools/apex-parser';
import { ExpressionField, ExpressionVisitor } from '.';

export type PostOpExpressionType = {
    type: 'postOp';
    operator: '++' | '--';
    value: ExpressionField;
};

export const makePostOrExpressionType = (ctx: PostOpExpressionContext): PostOpExpressionType => {
    const visitor = new ExpressionVisitor();
    const value = visitor.visit(ctx.expression());

    if (ctx.INC()) {
        return {
            type: 'postOp',
            operator: '++',
            value: value,
        };
    }
    if (ctx.DEC()) {
        return {
            type: 'postOp',
            operator: '--',
            value: value,
        };
    }

    throw new Error('Unsupported postOr operator');
};
