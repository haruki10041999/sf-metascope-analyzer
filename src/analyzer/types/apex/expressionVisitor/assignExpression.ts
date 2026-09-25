import { AssignExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

type AssignOperator = '=' | '+=' | '-=' | '*=' | '/=' | '&=' | '|=' | '^=' | '>>=' | '>>>=' | '<<=';

export type AssignExpressionType = {
    type: 'assignExpression';
    operator: AssignOperator;
    left: Omit<ExpressionType, 'type'>;
    right: Omit<ExpressionType, 'type'>;
};

export const makeAssignExpressionType = (ctx: AssignExpressionContext): AssignExpressionType => {
    const visitor = new ExpressionVisitor();
    const { type: leftType, ...left } = visitor.visit(ctx.expression(0));
    const { type: rightType, ...right } = visitor.visit(ctx.expression(1));

    if (ctx.ASSIGN()) {
        return {
            type: 'assignExpression',
            operator: '=',
            left,
            right,
        };
    }

    if (ctx.ADD_ASSIGN()) {
        return {
            type: 'assignExpression',
            operator: '+=',
            left,
            right,
        };
    }

    if (ctx.SUB_ASSIGN()) {
        return {
            type: 'assignExpression',
            operator: '-=',
            left,
            right,
        };
    }

    if (ctx.MUL_ASSIGN()) {
        return {
            type: 'assignExpression',
            operator: '*=',
            left,
            right,
        };
    }

    if (ctx.DIV_ASSIGN()) {
        return {
            type: 'assignExpression',
            operator: '/=',
            left,
            right,
        };
    }

    if (ctx.AND_ASSIGN()) {
        return {
            type: 'assignExpression',
            operator: '&=',
            left,
            right,
        };
    }

    if (ctx.OR_ASSIGN()) {
        return {
            type: 'assignExpression',
            operator: '|=',
            left,
            right,
        };
    }

    if (ctx.XOR_ASSIGN()) {
        return {
            type: 'assignExpression',
            operator: '^=',
            left,
            right,
        };
    }

    if (ctx.RSHIFT_ASSIGN()) {
        return {
            type: 'assignExpression',
            operator: '>>=',
            left,
            right,
        };
    }

    if (ctx.URSHIFT_ASSIGN()) {
        return {
            type: 'assignExpression',
            operator: '>>>=',
            left,
            right,
        };
    }

    if (ctx.LSHIFT_ASSIGN()) {
        return {
            type: 'assignExpression',
            operator: '<<=',
            left,
            right,
        };
    }

    throw new Error('値が異常です。AssignExpressionContext: ' + ctx.getText());
};

