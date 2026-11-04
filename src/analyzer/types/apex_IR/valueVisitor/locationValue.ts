import { LocationValueContext } from '@apexdevtools/apex-parser';

import { CoordinateValueTypeClass, ValueTypeClass, ValueVisitor, isCoordinateValueType } from '.';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    isApexValidClass,
    isApexValidClassList,
} from '../commonVisitor';

type LocationValueValue =
    | FieldNameTypeClass
    | BoundExpressionTypeClass
    | (CoordinateValueTypeClass | ApexErrorTypeClass)[];

export class LocationValueTypeClass extends ValueTypeClass<'locationValue', LocationValueValue> {
    private constructor(value: LocationValueValue | ApexErrorTypeClass) {
        super('locationValue', value);
    }

    static create(ctx: LocationValueContext): LocationValueTypeClass {
        if (
            !ctx.fieldName() &&
            !ctx.boundExpression() &&
            (!ctx.GEOLOCATION() || ctx.coordinateValue_list().length !== 2)
        ) {
            throw new Error('値が異常です。LocationValueContext: ' + ctx.getText());
        }

        let value: LocationValueValue | ApexErrorTypeClass;
        if (ctx.GEOLOCATION()) {
            value = isApexValidClassList(
                ctx.coordinateValue_list(),
                (ctx) => new ValueVisitor().visit(ctx),
                isCoordinateValueType,
                'coordinateValue',
            );
        } else {
            value = ctx.fieldName()
                ? isApexValidClass(
                      new NameVisitor().visit(ctx.fieldName()),
                      isFieldNameType,
                      'fieldName',
                  )
                : isApexValidClass(
                      new ExpressionVisitor().visit(ctx.boundExpression()),
                      isBoundExpressionType,
                      'boundExpression',
                  );
        }

        return new LocationValueTypeClass(value);
    }
}

export const isLocationValueType = (
    target: ApexCommonTypeClass<string>,
): target is LocationValueTypeClass => {
    return target instanceof LocationValueTypeClass;
};

