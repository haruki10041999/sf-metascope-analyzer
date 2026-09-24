import { EqualityExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

export type EqualityExpressionType = {
    type: 'equality';
    operator: '===' | '!==' | '==' | '!=' | '<>';
    left: ExpressionField;
    right: ExpressionField;
};

export const makeEqualityExpressionType = (
    ctx: EqualityExpressionContext,
): EqualityExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    if (ctx.TRIPLEEQUAL()) {
        return {
            type: 'equality',
            operator: '===',
            left: left,
            right: right,
        };
    }
    if (ctx.TRIPLENOTEQUAL()) {
        return {
            type: 'equality',
            operator: '!==',
            left: left,
            right: right,
        };
    }
    if (ctx.EQUAL()) {
        return {
            type: 'equality',
            operator: '==',
            left: left,
            right: right,
        };
    }
    if (ctx.NOTEQUAL()) {
        return {
            type: 'equality',
            operator: '!=',
            left: left,
            right: right,
        };
    }

    if (ctx.LESSANDGREATER()) {
        return {
            type: 'equality',
            operator: '<>',
            left: left,
            right: right,
        };
    }

    throw new Error('Unsupported equality operator');
};
