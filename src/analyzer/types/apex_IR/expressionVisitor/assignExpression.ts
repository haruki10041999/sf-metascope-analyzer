import { AssignExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

type AssignOperator = '=' | '+=' | '-=' | '*=' | '/=' | '&=' | '|=' | '^=' | '>>=' | '>>>=' | '<<=';

export type AssignExpressionType = {
    type: 'assignExpression';
    expression: {
        left: ExpressionType;
        operator: AssignOperator;
        right: ExpressionType;
    };
};

export const makeAssignExpressionType = (ctx: AssignExpressionContext): AssignExpressionType => {
    const visitor = new ExpressionVisitor();
    const left = visitor.visit(ctx.expression(0));
    const right = visitor.visit(ctx.expression(1));

    if (ctx.ASSIGN()) {
        return {
            type: 'assignExpression',
            expression: {
                left,
                operator: '=',
                right,
            },
        };
    }

    if (ctx.ADD_ASSIGN()) {
        return {
            type: 'assignExpression',
            expression: {
                left,
                operator: '+=',
                right,
            },
        };
    }

    if (ctx.SUB_ASSIGN()) {
        return {
            type: 'assignExpression',
            expression: {
                left,
                operator: '-=',
                right,
            },
        };
    }

    if (ctx.MUL_ASSIGN()) {
        return {
            type: 'assignExpression',
            expression: {
                left,
                operator: '*=',
                right,
            },
        };
    }

    if (ctx.DIV_ASSIGN()) {
        return {
            type: 'assignExpression',
            expression: {
                left,
                operator: '/=',
                right,
            },
        };
    }

    if (ctx.AND_ASSIGN()) {
        return {
            type: 'assignExpression',
            expression: {
                left,
                operator: '&=',
                right,
            },
        };
    }

    if (ctx.OR_ASSIGN()) {
        return {
            type: 'assignExpression',
            expression: {
                left,
                operator: '|=',
                right,
            },
        };
    }

    if (ctx.XOR_ASSIGN()) {
        return {
            type: 'assignExpression',
            expression: {
                left,
                operator: '^=',
                right,
            },
        };
    }

    if (ctx.RSHIFT_ASSIGN()) {
        return {
            type: 'assignExpression',
            expression: {
                left,
                operator: '>>=',
                right,
            },
        };
    }

    if (ctx.URSHIFT_ASSIGN()) {
        return {
            type: 'assignExpression',
            expression: {
                left,
                operator: '>>>=',
                right,
            },
        };
    }

    if (ctx.LSHIFT_ASSIGN()) {
        return {
            type: 'assignExpression',
            expression: {
                left,
                operator: '<<=',
                right,
            },
        };
    }

    throw new Error('値が異常です。AssignExpressionContext: ' + ctx.getText());
};

