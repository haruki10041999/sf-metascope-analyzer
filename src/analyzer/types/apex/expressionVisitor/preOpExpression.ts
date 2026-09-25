import { PreOpExpressionContext } from '@apexdevtools/apex-parser';
import { ExpressionType, ExpressionVisitor } from '.';

export type PreOpExpressionType = {
    type: 'preOpExpression';
    operator: '+' | '-' | '++' | '--';
    value: Omit<ExpressionType, 'type'>;
};

export const makePreOpExpressionType = (ctx: PreOpExpressionContext): PreOpExpressionType => {
    const { type, ...value } = new ExpressionVisitor().visit(ctx.expression());

    if (ctx.ADD()) {
        return {
            type: 'preOpExpression',
            operator: '+',
            value: value,
        };
    }
    if (ctx.SUB()) {
        return {
            type: 'preOpExpression',
            operator: '-',
            value: value,
        };
    }
    if (ctx.INC()) {
        return {
            type: 'preOpExpression',
            operator: '++',
            value: value,
        };
    }
    if (ctx.DEC()) {
        return {
            type: 'preOpExpression',
            operator: '--',
            value: value,
        };
    }

    throw new Error('値が異常です。PreOpExpressionContext: ' + ctx.getText());
};

