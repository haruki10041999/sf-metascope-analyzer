import { DotExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { AnyIdTypeClass, IdVisitor, isAnyIdType } from '../idVisitor';
import { DotMethodCallTypeClass, CallVisitor, isDotMethodCallType } from '../callVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class DotExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    ExpressionAllTypeClass,
    AnyIdTypeClass | DotMethodCallTypeClass
> {
    private constructor(
        left: ExpressionAllTypeClass | ErrorTypeClass,
        right: AnyIdTypeClass | DotMethodCallTypeClass | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('dotExpression', left, right, operator, errorClasses);
    }

    static create(ctx: DotExpressionContext): DotExpressionTypeClass {
        if (
            !ctx.expression() &&
            (!ctx.anyId() || !ctx.dotMethodCall()) &&
            (!ctx.DOT() || !ctx.QUESTIONDOT())
        ) {
            throw new Error('値が異常です。DotExpressionContext: ' + ctx.getText());
        }

        let left: ExpressionTypeClass<unknown> | null = null;
        let right: AnyIdTypeClass | DotMethodCallTypeClass | null = null;
        let operator: string | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());
        if (isExpressionTypeAll(expressionTypeClass)) {
            left = expressionTypeClass;
        } else {
            errorClasses['left'] = expressionTypeClass;
        }

        if (ctx.anyId()) {
            const anyIdTypeClass = new IdVisitor().visit(ctx.anyId());
            if (isAnyIdType(anyIdTypeClass)) {
                right = anyIdTypeClass;
            } else if (isErrorType(anyIdTypeClass)) {
                errorClasses['right'] = anyIdTypeClass;
            }
        }

        if (ctx.dotMethodCall()) {
            const dotMethodCallTypeClass = new CallVisitor().visit(ctx.dotMethodCall());
            if (isDotMethodCallType(dotMethodCallTypeClass)) {
                right = dotMethodCallTypeClass;
            } else if (isErrorType(dotMethodCallTypeClass)) {
                errorClasses['right'] = dotMethodCallTypeClass;
            }
        }

        if (ctx.DOT()) {
            operator = '.';
        }

        if (ctx.QUESTIONDOT()) {
            operator = '?.';
        }

        return new DotExpressionTypeClass(left, right, operator, errorClasses);
    }
}

export const isDotExpressionType = (target: CommonTypeClass): target is DotExpressionTypeClass => {
    return target instanceof DotExpressionTypeClass;
};
