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
    string,
    AnyIdTypeClass | DotMethodCallTypeClass
> {
    private constructor(
        left: ExpressionAllTypeClass | ErrorTypeClass,
        right: AnyIdTypeClass | DotMethodCallTypeClass | ErrorTypeClass,
        operator: string,
    ) {
        super('dotExpression', left, right, operator);
    }

    static create(ctx: DotExpressionContext): DotExpressionTypeClass {
        if (
            !ctx.expression() ||
            (!ctx.anyId() && !ctx.dotMethodCall()) ||
            (!ctx.DOT() && !ctx.QUESTIONDOT())
        ) {
            throw new Error('値が異常です。DotExpressionContext: ' + ctx.getText());
        }

        return new DotExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isExpressionTypeAll,
                'expression',
            ),
            ctx.anyId()
                ? isValidClass(new IdVisitor().visit(ctx.anyId()), isAnyIdType, 'anyId')
                : isValidClass(
                      new CallVisitor().visit(ctx.dotMethodCall()),
                      isDotMethodCallType,
                      'dotMethodCall',
                  ),
            ctx.DOT() ? '.' : '?.',
        );
    }
}

export const isDotExpressionType = (target: CommonTypeClass): target is DotExpressionTypeClass => {
    return target instanceof DotExpressionTypeClass;
};

