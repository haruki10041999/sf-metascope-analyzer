import { CoordinateValueContext } from '@apexdevtools/apex-parser';

import { ValueTypeClass } from '.';

import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import { SignedNumberTypeClass, LiteralVisitor, isSignedNumberType } from '../literalVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class CoordinateValueTypeClass extends ValueTypeClass<
    'coordinateValue',
    SignedNumberTypeClass | BoundExpressionTypeClass
> {
    private constructor(
        value: SignedNumberTypeClass | BoundExpressionTypeClass | ApexErrorTypeClass,
    ) {
        super('coordinateValue', value);
    }

    static create(ctx: CoordinateValueContext): CoordinateValueTypeClass {
        if (!ctx.signedNumber() && !ctx.boundExpression()) {
            throw new Error('値が異常です。CoordinateValueContext: ' + ctx.getText());
        }

        return new CoordinateValueTypeClass(
            ctx.signedNumber()
                ? isApexValidClass(
                      new LiteralVisitor().visit(ctx.signedNumber()),
                      isSignedNumberType,
                      'signedNumber',
                  )
                : isApexValidClass(
                      new ExpressionVisitor().visit(ctx.boundExpression()),
                      isBoundExpressionType,
                      'boundExpression',
                  ),
        );
    }
}

export const isCoordinateValueType = (
    target: ApexCommonTypeClass<string>,
): target is CoordinateValueTypeClass => {
    return target instanceof CoordinateValueTypeClass;
};

