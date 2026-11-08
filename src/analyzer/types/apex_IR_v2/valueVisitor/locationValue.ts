import { LocationValueContext } from '@apexdevtools/apex-parser';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    visitNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';
import { CoordinateValueTypeClass } from './coordinateValue';

export type LocationValueType = TypeField<'locationValue'> & {
    value: FieldNameTypeClass | BoundExpressionTypeClass | CoordinateValueTypeClass[];
};

export class LocationValueTypeClass extends ApexCommonTypeClass<
    'locationValue',
    LocationValueType
> {
    private constructor(
        value: FieldNameTypeClass | BoundExpressionTypeClass | CoordinateValueTypeClass[],
        sourceSpan: SourceSpan,
    ) {
        super('locationValue', { value: value }, sourceSpan);
    }

    static create(ctx: LocationValueContext): LocationValueTypeClass {
        if (ctx.GEOLOCATION()) {
            return new LocationValueTypeClass(
                ctx.coordinateValue_list().map((c) => CoordinateValueTypeClass.create(c)),
                getSourceSpan(ctx),
            );
        } else {
            if (ctx.fieldName()) {
                return new LocationValueTypeClass(
                    FieldNameTypeClass.create(ctx.fieldName()),
                    getSourceSpan(ctx),
                );
            } else {
                return new LocationValueTypeClass(
                    BoundExpressionTypeClass.create(ctx.boundExpression()),
                    getSourceSpan(ctx),
                );
            }
        }
    }
}

export const isLocationValueType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is LocationValueTypeClass => {
    return isSpicifyApexCommonTypeClass('locationValue', target);
};
