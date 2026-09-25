import { EqualityExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type EqualityExpressionType = {
    type: 'equalityExpression';
    operator: '===' | '!==' | '==' | '!=' | '<>';
    left: Omit<ExpressionType, 'type'>;
    right: Omit<ExpressionType, 'type'>;
};

export const makeEqualityExpressionType = (
    ctx: EqualityExpressionContext,
): EqualityExpressionType => {
    const { type: leftType, ...left } = new ExpressionVisitor().visit(ctx.expression(0));
    const { type: rightType, ...right } = new ExpressionVisitor().visit(ctx.expression(1));

    if (ctx.TRIPLEEQUAL()) {
        return {
            type: 'equalityExpression',
            operator: '===',
            left: left,
            right: right,
        };
    }
    if (ctx.TRIPLENOTEQUAL()) {
        return {
            type: 'equalityExpression',
            operator: '!==',
            left: left,
            right: right,
        };
    }
    if (ctx.EQUAL()) {
        return {
            type: 'equalityExpression',
            operator: '==',
            left: left,
            right: right,
        };
    }
    if (ctx.NOTEQUAL()) {
        return {
            type: 'equalityExpression',
            operator: '!=',
            left: left,
            right: right,
        };
    }

    if (ctx.LESSANDGREATER()) {
        return {
            type: 'equalityExpression',
            operator: '<>',
            left: left,
            right: right,
        };
    }

    throw new Error('値が異常です。EqualityExpressionContext: ' + ctx.getText());
};

