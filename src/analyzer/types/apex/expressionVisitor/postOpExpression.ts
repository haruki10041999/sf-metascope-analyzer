import { PostOpExpressionContext } from '@apexdevtools/apex-parser';
import { ExpressionType, ExpressionVisitor } from '.';

export type PostOpExpressionType = {
    type: 'postOpExpression';
    operator: '++' | '--';
    value: Omit<ExpressionType, 'type'>;
};

export const makePostOpExpressionType = (ctx: PostOpExpressionContext): PostOpExpressionType => {
    const { type, ...value } = new ExpressionVisitor().visit(ctx.expression());

    if (ctx.INC()) {
        return {
            type: 'postOpExpression',
            operator: '++',
            value: value,
        };
    }
    if (ctx.DEC()) {
        return {
            type: 'postOpExpression',
            operator: '--',
            value: value,
        };
    }

    throw new Error('値が異常です。PostOpExpressionContext: ' + ctx.getText());
};

