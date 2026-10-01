import { MethodCallExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass } from '../expressionVisitor';

import { MethodCallTypeClass, CallVisitor, isMethodCallType } from '../callVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';
import { Target } from 'inspector';

export class MethodCallExpressionType extends ExpressionTypeClass<MethodCallTypeClass> {
    private constructor(
        value: MethodCallTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('methodCallExpression', value, errorClasses);
    }

    static create(ctx: MethodCallExpressionContext): MethodCallExpressionType {
        if (!ctx.methodCall()) {
            throw new Error('値が異常です。MethodCallExpressionContext: ' + ctx.getText());
        }

        let value: MethodCallTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const expressionTypeClass = new CallVisitor().visit(ctx.methodCall());
        if (isMethodCallType(expressionTypeClass)) {
            value = expressionTypeClass;
        } else if (isErrorType(expressionTypeClass)) {
            errorClasses['value'] = expressionTypeClass;
        }

        return new MethodCallExpressionType(value, errorClasses);
    }
}

export const isMethodCallExpressionType = (
    target: CommonTypeClass,
): target is MethodCallExpressionType => {
    return target instanceof MethodCallExpressionType;
};

