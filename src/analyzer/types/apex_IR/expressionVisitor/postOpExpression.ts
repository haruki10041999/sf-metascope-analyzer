import { PostOpExpressionContext } from '@apexdevtools/apex-parser';
import { ExpressionType, ExpressionVisitor } from '.';

export type PostOpExpressionType = {
    type: 'postOpExpression';
    expression: {
        operator: '++' | '--';
        value: ExpressionType;
    };
};

export const makePostOpExpressionType = (ctx: PostOpExpressionContext): PostOpExpressionType => {
    const value = new ExpressionVisitor().visit(ctx.expression());

    if (ctx.INC()) {
        return {
            type: 'postOpExpression',
            expression: {
                operator: '++',
                value: value,
            },
        };
    }
    if (ctx.DEC()) {
        return {
            type: 'postOpExpression',
            expression: {
                operator: '--',
                value: value,
            },
        };
    }

    throw new Error('値が異常です。PostOpExpressionContext: ' + ctx.getText());
};

