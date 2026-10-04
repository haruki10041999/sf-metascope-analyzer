import { AssignExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class AssignExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    ExpressionAllTypeClass,
    ExpressionAllTypeClass
> {
    private constructor(
        left: ExpressionAllTypeClass | ErrorTypeClass,
        right: ExpressionAllTypeClass | ErrorTypeClass,
        operator: string,
    ) {
        super('assignExpression', left, right, operator);
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

        let operator = '';
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

        return new AssignExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(0)),
                isExpressionTypeAll,
                'expression',
            ),
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(1)),
                isExpressionTypeAll,
                'expression',
            ),
            operator,
        );
    }
}

export const isAssignExpressionType = (
    target: CommonTypeClass,
): target is AssignExpressionTypeClass => {
    return target instanceof AssignExpressionTypeClass;
};
