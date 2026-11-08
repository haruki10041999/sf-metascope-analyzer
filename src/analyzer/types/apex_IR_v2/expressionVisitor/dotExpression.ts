import { DotExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { AnyIdTypeClass, IdVisitor, isAnyIdType } from '../idVisitor';
import { DotMethodCallTypeClass, CallVisitor, isDotMethodCallType } from '../callVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class DotExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'dotExpression',
    BasedExpressionTypeClass,
    '.' | '?.',
    AnyIdTypeClass | DotMethodCallTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ApexErrorTypeClass,
        right: AnyIdTypeClass | DotMethodCallTypeClass | ApexErrorTypeClass,
        operator: '.' | '?.',
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
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(),
                isBasedExpressionType,
                'expression',
            ),
            ctx.anyId()
                ? visitNode(new IdVisitor(), ctx.anyId(), isAnyIdType, 'anyId')
                : visitNode(
                      new CallVisitor(),
                      ctx.dotMethodCall(),
                      isDotMethodCallType,
                      'dotMethodCall',
                  ),
            ctx.DOT() ? '.' : '?.',
        );
    }
}

export const isDotExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is DotExpressionTypeClass => {
    return target instanceof DotExpressionTypeClass;
};
