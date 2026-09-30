import { AssignExpressionContext } from '@apexdevtools/apex-parser';

import {
    OperatorExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class AssignExpressionTypeClass extends OperatorExpressionTypeClass {
    private constructor(
        left: ExpressionTypeClass | null,
        right: ExpressionTypeClass | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('assignExpression', left, right, operator, errorClasses);
    }

    static create(ctx: AssignExpressionContext): AssignExpressionTypeClass {
        if (
            !ctx.expression_list() ||
            ctx.expression_list().length !== 2 ||
            (!ctx.ASSIGN() &&
                !ctx.ADD_ASSIGN() &&
                !ctx.SUB_ASSIGN() &&
                !ctx.MUL_ASSIGN() &&
                !ctx.DIV_ASSIGN() &&
                !ctx.AND_ASSIGN() &&
                !ctx.OR_ASSIGN() &&
                !ctx.XOR_ASSIGN() &&
                !ctx.RSHIFT_ASSIGN() &&
                !ctx.URSHIFT_ASSIGN() &&
                !ctx.LSHIFT_ASSIGN())
        ) {
            throw new Error('値が異常です。AssignExpressionContext: ' + ctx.getText());
        }

        const leftExpressionTypeClass = new ExpressionVisitor().visit(ctx.expression(0));
        const rightExpressionTypeClass = new ExpressionVisitor().visit(ctx.expression(1));

        let left: ExpressionTypeClass | null = null;
        let right: ExpressionTypeClass | null = null;
        let operator: string | null = null;
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        if (isExpressionTypeAll(leftExpressionTypeClass)) {
            left = leftExpressionTypeClass;
        } else {
            errorTypeClasses['left'] = leftExpressionTypeClass;
        }
        if (isExpressionTypeAll(rightExpressionTypeClass)) {
            right = rightExpressionTypeClass;
        } else {
            errorTypeClasses['right'] = rightExpressionTypeClass;
        }

        if (ctx.ASSIGN()) {
            operator = '=';
        }

        if (ctx.ADD_ASSIGN()) {
            operator = '+=';
        }

        if (ctx.SUB_ASSIGN()) {
            operator = '-=';
        }

        if (ctx.MUL_ASSIGN()) {
            operator = '*=';
        }

        if (ctx.DIV_ASSIGN()) {
            operator = '/=';
        }

        if (ctx.AND_ASSIGN()) {
            operator = '&=';
        }

        if (ctx.OR_ASSIGN()) {
            operator = '|=';
        }

        if (ctx.XOR_ASSIGN()) {
            operator = '^=';
        }

        if (ctx.RSHIFT_ASSIGN()) {
            operator = '>>=';
        }

        if (ctx.URSHIFT_ASSIGN()) {
            operator = '>>>=';
        }

        if (ctx.LSHIFT_ASSIGN()) {
            operator = '<<=';
        }

        return new AssignExpressionTypeClass(left, right, operator, errorTypeClasses);
    }
}

export const isAssignExpressionType = (
    target: CommonTypeClass,
): target is AssignExpressionTypeClass => {
    return target instanceof AssignExpressionTypeClass;
};

