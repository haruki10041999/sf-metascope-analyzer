import { InstanceOfExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class InstanceOfExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    ExpressionTypeClass<unknown>,
    TypeRefTypeClass
> {
    private constructor(
        left: ExpressionTypeClass<unknown> | null,
        right: TypeRefTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('instanceOfExpression', left, right, 'instanceof', errorClasses);
    }

    static create(ctx: InstanceOfExpressionContext): InstanceOfExpressionTypeClass {
        if (!ctx.expression() || !ctx.typeRef()) {
            throw new Error('値が異常です。InstanceOfExpressionContext: ' + ctx.getText());
        }

        let left: ExpressionTypeClass<unknown> | null = null;
        let right: TypeRefTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());
        if (isExpressionTypeAll(expressionTypeClass)) {
            left = expressionTypeClass;
        } else {
            errorClasses['left'] = expressionTypeClass;
        }

        const typeTypeClass = new TypeVisitor().visit(ctx.typeRef());
        if (isTypeRefType(typeTypeClass)) {
            right = typeTypeClass;
        } else if (isErrorType(typeTypeClass)) {
            errorClasses['right'] = typeTypeClass;
        }

        return new InstanceOfExpressionTypeClass(left, right, errorClasses);
    }
}

export const isInstanceOfExpressionType = (
    target: CommonTypeClass,
): target is InstanceOfExpressionTypeClass => {
    return target instanceof InstanceOfExpressionTypeClass;
};

