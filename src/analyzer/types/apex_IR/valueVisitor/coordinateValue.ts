import { CoordinateValueContext } from '@apexdevtools/apex-parser';

import { ValueTypeClass } from '.';

import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import { SignedNumberTypeClass, LiteralVisitor, isSignedNumberType } from '../literalVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

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
                ? visitNode(
                      new LiteralVisitor(),
                      ctx.signedNumber(),
                      isSignedNumberType,
                      'signedNumber',
                  )
                : visitNode(
                      new ExpressionVisitor(),
                      ctx.boundExpression(),
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
