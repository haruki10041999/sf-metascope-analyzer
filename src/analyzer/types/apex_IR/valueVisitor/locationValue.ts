import { LocationValueContext } from '@apexdevtools/apex-parser';

import { CoordinateValueTypeClass, ValueTypeClass, ValueVisitor, isCoordinateValueType } from '.';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

type LocationValueValue =
    | FieldNameTypeClass
    | BoundExpressionTypeClass
    | { value: (CoordinateValueTypeClass | ErrorTypeClass)[]; geoLocation: boolean };

export class LocationValueTypeClass extends ValueTypeClass<LocationValueValue> {
    private constructor(value: LocationValueValue | ErrorTypeClass) {
        super('locationValue', value);
    }

    static create(ctx: LocationValueContext): LocationValueTypeClass {
        if (
            !ctx.fieldName() &&
            !ctx.boundExpression() &&
            (!ctx.coordinateValue_list() || ctx.coordinateValue_list().length !== 2)
        ) {
            throw new Error('値が異常です。LocationValueContext: ' + ctx.getText());
        }

        let value: LocationValueValue | ErrorTypeClass;
        if (ctx.fieldName()) {
            value = isValidClass(
                new NameVisitor().visit(ctx.fieldName()),
                isFieldNameType,
                'fieldName',
            );
        } else if (ctx.boundExpression()) {
            value = isValidClass(
                new ExpressionVisitor().visit(ctx.boundExpression()),
                isBoundExpressionType,
                'boundExpression',
            );
        } else {
            value = {
                value: isValidClassList(
                    ctx.coordinateValue_list() || [],
                    (ctx) => new ValueVisitor().visit(ctx),
                    isCoordinateValueType,
                    'coodinateValue',
                ),
                geoLocation: ctx.GEOLOCATION() !== null,
            };
        }

        return new LocationValueTypeClass(value);
    }
}

export const isLocationValueType = (target: CommonTypeClass): target is LocationValueTypeClass => {
    return target instanceof LocationValueTypeClass;
};
