import { PreOpExpressionContext } from '@apexdevtools/apex-parser';
import { ExpressionType, ExpressionVisitor } from '.';

export type PreOpExpressionType = {
    type: 'preOpExpression';
    expression: {
        operator: '+' | '-' | '++' | '--';
        value: ExpressionType;
    };
};

export const makePreOpExpressionType = (ctx: PreOpExpressionContext): PreOpExpressionType => {
    const value = new ExpressionVisitor().visit(ctx.expression());

    if (ctx.ADD()) {
        return {
            type: 'preOpExpression',
            expression: {
                operator: '+',
                value: value,
            },
        };
    }
    if (ctx.SUB()) {
        return {
            type: 'preOpExpression',
            expression: {
                operator: '-',
                value: value,
            },
        };
    }
    if (ctx.INC()) {
        return {
            type: 'preOpExpression',
            expression: {
                operator: '++',
                value: value,
            },
        };
    }
    if (ctx.DEC()) {
        return {
            type: 'preOpExpression',
            expression: {
                operator: '--',
                value: value,
            },
        };
    }

    throw new Error('値が異常です。PreOpExpressionContext: ' + ctx.getText());
};

