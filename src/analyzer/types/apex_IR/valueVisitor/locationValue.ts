import { LocationValueContext } from '@apexdevtools/apex-parser';

import { CoordinateValueTypeClass, ValueTypeClass, ValueVisitor, isCoordinateValueType } from '.';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

type LocationValueValue = FieldNameTypeClass | BoundExpressionTypeClass;

export class LocationValueTypeClass extends ValueTypeClass<LocationValueValue | null> {
    // GEOLOCATION(lat, lng) 形式のときのみ [緯度, 経度]、それ以外は null
    private coordinates: (CoordinateValueTypeClass | ErrorTypeClass)[] | null;

    private constructor(
        value: LocationValueValue | ErrorTypeClass | null,
        coordinates: (CoordinateValueTypeClass | ErrorTypeClass)[] | null,
    ) {
        super('locationValue', value);
        this.coordinates = coordinates;
    }

    static create(ctx: LocationValueContext): LocationValueTypeClass {
        if (
            !ctx.fieldName() &&
            !ctx.boundExpression() &&
            (!ctx.GEOLOCATION() || ctx.coordinateValue_list().length !== 2)
        ) {
            throw new Error('値が異常です。LocationValueContext: ' + ctx.getText());
        }

        if (ctx.GEOLOCATION()) {
            return new LocationValueTypeClass(
                null,
                isValidClassList(
                    ctx.coordinateValue_list(),
                    (ctx) => new ValueVisitor().visit(ctx),
                    isCoordinateValueType,
                    'coordinateValue',
                ),
            );
        }

        return new LocationValueTypeClass(
            ctx.fieldName()
                ? isValidClass(
                      new NameVisitor().visit(ctx.fieldName()),
                      isFieldNameType,
                      'fieldName',
                  )
                : isValidClass(
                      new ExpressionVisitor().visit(ctx.boundExpression()),
                      isBoundExpressionType,
                      'boundExpression',
                  ),
            null,
        );
    }

    getCoordinates(): (CoordinateValueTypeClass | ErrorTypeClass)[] | null {
        return this.coordinates;
    }
}

export const isLocationValueType = (target: CommonTypeClass): target is LocationValueTypeClass => {
    return target instanceof LocationValueTypeClass;
};

