import { CoordinateValueContext } from '@apexdevtools/apex-parser';

import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import { SignedNumberTypeClass, LiteralVisitor, isSignedNumberType } from '../literalVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type CoordinateValueType = TypeField<'coordinateValue'> & {
    value: SignedNumberTypeClass | BoundExpressionTypeClass;
};

export class CoordinateValueTypeClass extends ApexCommonTypeClass<
    'coordinateValue',
    CoordinateValueType
> {
    private constructor(
        value: SignedNumberTypeClass | BoundExpressionTypeClass,
        sourceSpan: SourceSpan,
    ) {
        super('coordinateValue', { value: value }, sourceSpan);
    }

    static create(ctx: CoordinateValueContext): CoordinateValueTypeClass {
        if (ctx.signedNumber()) {
            return new CoordinateValueTypeClass(
                SignedNumberTypeClass.create(ctx.signedNumber()),
                getSourceSpan(ctx),
            );
        } else {
            return new CoordinateValueTypeClass(
                BoundExpressionTypeClass.create(ctx.boundExpression()),
                getSourceSpan(ctx),
            );
        }
    }
}

export const isCoordinateValueType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is CoordinateValueTypeClass => {
    return isSpicifyApexCommonTypeClass('coordinateValue', target);
};
