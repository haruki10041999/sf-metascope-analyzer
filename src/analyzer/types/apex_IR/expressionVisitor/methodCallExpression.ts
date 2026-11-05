import { MethodCallExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass } from '../expressionVisitor';

import { MethodCallTypeClass, CallVisitor, isMethodCallType } from '../callVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class MethodCallExpressionTypeClass extends ExpressionTypeClass<
    'methodCallExpression',
    MethodCallTypeClass
> {
    private constructor(value: MethodCallTypeClass | ApexErrorTypeClass) {
        super('methodCallExpression', value);
    }

    static create(ctx: MethodCallExpressionContext): MethodCallExpressionTypeClass {
        if (!ctx.methodCall()) {
            throw new Error('値が異常です。MethodCallExpressionContext: ' + ctx.getText());
        }

        return new MethodCallExpressionTypeClass(
            visitNode(new CallVisitor(), ctx.methodCall(), isMethodCallType, 'value'),
        );
    }
}

export const isMethodCallExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is MethodCallExpressionTypeClass => {
    return target instanceof MethodCallExpressionTypeClass;
};
