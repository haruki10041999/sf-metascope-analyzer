import { CoordinateValueContext } from '@apexdevtools/apex-parser';

import { ValueTypeClass } from '.';

import {
    BoundExpressionTypeClass,
    ExpressionVisitor,,
    isBoundExpressionType,
} from '../expressionVisitor';
import { SignedNumberTypeClass, LiteralVisitor, isSignedNumberType } from '../literalVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class CoordinateValueTypeClass extends ValueTypeClass<
    SignedNumberTypeClass | BoundExpressionTypeClass
> {
    private constructor(value: SignedNumberTypeClass | BoundExpressionTypeClass | ErrorTypeClass) {
        super('coordinateValue', value);
    }

    static create(ctx: CoordinateValueContext): CoordinateValueTypeClass {
        if (!ctx.signedNumber() && !ctx.boundExpression()) {
            throw new Error('値が異常です。CoordinateValueContext: ' + ctx.getText());
        }

        return new CoordinateValueTypeClass(
            ctx.signedNumber()
                ? isValidClass(
                      new LiteralVisitor().visit(ctx.signedNumber()),
                      isSignedNumberType,
                      'signedNumber',
                  )
                : isValidClass(
                      new ExpressionVisitor().visit(ctx.boundExpression()),
                      isBoundExpressionType,
                      'boundExpression',
                  ),
        );
    }
}

export const isCoordinateValueType = (
    target: CommonTypeClass,
): target is CoordinateValueTypeClass => {
    return target instanceof CoordinateValueTypeClass;
};
