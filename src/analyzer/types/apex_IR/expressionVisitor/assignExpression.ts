import { AssignExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

type AssignOperatorType =
    '=' | '+=' | '-=' | '*=' | '/=' | '&=' | '|=' | '^=' | '>>=' | '>>>=' | '<<=';

export class AssignExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'assignExpression',
    BasedExpressionTypeClass,
    AssignOperatorType,
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ErrorTypeClass,
        right: BasedExpressionTypeClass | ErrorTypeClass,
        operator: AssignOperatorType,
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

        let operator: AssignOperatorType;
        if (ctx.ASSIGN()) {
            operator = '=';
        } else if (ctx.ADD_ASSIGN()) {
            operator = '+=';
        } else if (ctx.SUB_ASSIGN()) {
            operator = '-=';
        } else if (ctx.MUL_ASSIGN()) {
            operator = '*=';
        } else if (ctx.DIV_ASSIGN()) {
            operator = '/=';
        } else if (ctx.AND_ASSIGN()) {
            operator = '&=';
        } else if (ctx.OR_ASSIGN()) {
            operator = '|=';
        } else if (ctx.XOR_ASSIGN()) {
            operator = '^=';
        } else if (ctx.RSHIFT_ASSIGN()) {
            operator = '>>=';
        } else if (ctx.URSHIFT_ASSIGN()) {
            operator = '>>>=';
        } else {
            operator = '<<=';
        }

        return new AssignExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(0)),
                isBasedExpressionType,
                'expression',
            ),
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(1)),
                isBasedExpressionType,
                'expression',
            ),
            operator,
        );
    }
}

export const isAssignExpressionType = (
    target: CommonTypeClass<string>,
): target is AssignExpressionTypeClass => {
    return target instanceof AssignExpressionTypeClass;
};
