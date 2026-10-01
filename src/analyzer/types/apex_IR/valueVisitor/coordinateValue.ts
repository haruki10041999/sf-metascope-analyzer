import { CoordinateValueContext } from '@apexdevtools/apex-parser';

import { ValueTypeClass } from '.';

import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
    isBoundExpressionType,
} from '../expressionVisitor';
import { SignedNumberTypeClass, LiteralVisitor, isSignedNumberType } from '../literalVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class CoordinateValueTypeClass extends ValueTypeClass<
    SignedNumberTypeClass | BoundExpressionTypeClass
> {
    private constructor(
        value: SignedNumberTypeClass | BoundExpressionTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('coordinateValue', value, errorClasses);
    }

    static create(ctx: CoordinateValueContext): CoordinateValueTypeClass {
        if (!ctx.signedNumber() && !ctx.boundExpression()) {
            throw new Error('値が異常です。CoordinateValueContext: ' + ctx.getText());
        }

        let value: SignedNumberTypeClass | BoundExpressionTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        if (ctx.signedNumber()) {
            const literalTypeClass = new LiteralVisitor().visit(ctx.signedNumber());
            if (isSignedNumberType(literalTypeClass)) {
                value = literalTypeClass;
            } else if (isErrorType(literalTypeClass)) {
                errorClasses['value'] = literalTypeClass;
            }
        }

        if (ctx.boundExpression()) {
            const expressionTypeClass = new ExpressionVisitor().visit(ctx.boundExpression());
            if (
                isExpressionTypeAll(expressionTypeClass) &&
                isBoundExpressionType(expressionTypeClass)
            ) {
                value = expressionTypeClass;
            } else if (isErrorType(expressionTypeClass)) {
                errorClasses['value'] = expressionTypeClass;
            }
        }
        return new CoordinateValueTypeClass(value, errorClasses);
    }
}

export const isCoordinateValueType = (
    target: CommonTypeClass,
): target is CoordinateValueTypeClass => {
    return target instanceof CoordinateValueTypeClass;
};

