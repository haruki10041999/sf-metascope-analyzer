import { CoordinateValueContext } from '@apexdevtools/apex-parser';

import { BoundExpressionTypeClass } from '../expressionVisitor';
import { SignedNumberTypeClass } from '../literalVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type CoordinateValueType = TypeField<'coordinateValue'> & {
    value: SignedNumberTypeClass | BoundExpressionTypeClass;
};

export class CoordinateValueTypeClass extends ApexCommonTypeClass<
    'coordinateValue',
    CoordinateValueType
> {
    private constructor(fields: FieldsOf<CoordinateValueType>, sourceSpan: SourceSpan) {
        super('coordinateValue', fields, sourceSpan);
    }

    static create(ctx: CoordinateValueContext): CoordinateValueTypeClass {
        return new CoordinateValueTypeClass(
            {
                value: ctx.signedNumber()
                    ? createNode(
                          ctx.signedNumber(),
                          (c) => SignedNumberTypeClass.create(c),
                          'signedNumber',
                      )
                    : createNode(
                          ctx.boundExpression(),
                          (c) => BoundExpressionTypeClass.create(c),
                          'boundExpression',
                      ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): CoordinateValueType['value'] {
        return this.getFields().value;
    }
}

export const isCoordinateValueType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is CoordinateValueTypeClass => {
    return isSpicifyApexCommonTypeClass('coordinateValue', target);
};
