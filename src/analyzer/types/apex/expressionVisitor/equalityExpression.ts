import { EqualityExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

export type EqualityExpressionType = {
    type: 'equalityExpression';
    expression: {
        left: ExpressionType;
        operator: '===' | '!==' | '==' | '!=' | '<>';
        right: ExpressionType;
    };
};

export const makeEqualityExpressionType = (
    ctx: EqualityExpressionContext,
): EqualityExpressionType => {
    const left = new ExpressionVisitor().visit(ctx.expression(0));
    const right = new ExpressionVisitor().visit(ctx.expression(1));

    if (ctx.TRIPLEEQUAL()) {
        return {
            type: 'equalityExpression',
            expression: {
                left: left,
                operator: '===',
                right: right,
            },
        };
    }
    if (ctx.TRIPLENOTEQUAL()) {
        return {
            type: 'equalityExpression',
            expression: {
                left: left,
                operator: '!==',
                right: right,
            },
        };
    }
    if (ctx.EQUAL()) {
        return {
            type: 'equalityExpression',
            expression: {
                left: left,
                operator: '==',
                right: right,
            },
        };
    }
    if (ctx.NOTEQUAL()) {
        return {
            type: 'equalityExpression',
            expression: {
                left: left,
                operator: '!=',
                right: right,
            },
        };
    }

    if (ctx.LESSANDGREATER()) {
        return {
            type: 'equalityExpression',
            expression: {
                left: left,
                operator: '<>',
                right: right,
            },
        };
    }

    throw new Error('値が異常です。EqualityExpressionContext: ' + ctx.getText());
};

