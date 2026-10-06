import { MethodCallExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass } from '../expressionVisitor';

import { MethodCallTypeClass, CallVisitor, isMethodCallType } from '../callVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class MethodCallExpressionTypeClass extends ExpressionTypeClass<MethodCallTypeClass> {
    private constructor(value: MethodCallTypeClass | ErrorTypeClass) {
        super('methodCallExpression', value);
    }

    static create(ctx: MethodCallExpressionContext): MethodCallExpressionTypeClass {
        if (!ctx.methodCall()) {
            throw new Error('値が異常です。MethodCallExpressionContext: ' + ctx.getText());
        }

        return new MethodCallExpressionTypeClass(
            isValidClass(new CallVisitor().visit(ctx.methodCall()), isMethodCallType, 'value'),
        );
    }
}

export const isMethodCallExpressionType = (
    target: CommonTypeClass,
): target is MethodCallExpressionTypeClass => {
    return target instanceof MethodCallExpressionTypeClass;
};

