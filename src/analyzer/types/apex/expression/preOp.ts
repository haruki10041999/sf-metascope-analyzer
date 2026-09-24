import { PreOpExpressionContext } from '@apexdevtools/apex-parser';
import { ExpressionField, ExpressionVisitor } from '.';

export type PreOpExpressionType = {
    type: 'preOp';
    operator: '+' | '-' | '++' | '--';
    value: ExpressionField;
};

export const makePreOpExpressionType = (ctx: PreOpExpressionContext): PreOpExpressionType => {
    const value = new ExpressionVisitor().visit(ctx.expression());

    if (ctx.ADD()) {
        return {
            type: 'preOp',
            operator: '+',
            value: value,
        };
    }
    if (ctx.SUB()) {
        return {
            type: 'preOp',
            operator: '-',
            value: value,
        };
    }
    if (ctx.INC()) {
        return {
            type: 'preOp',
            operator: '++',
            value: value,
        };
    }
    if (ctx.DEC()) {
        return {
            type: 'preOp',
            operator: '--',
            value: value,
        };
    }

    throw new Error('Unsupported preOp operator');
};
