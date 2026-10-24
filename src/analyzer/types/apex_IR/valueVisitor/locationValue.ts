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
    FieldNameTypeClass | BoundExpressionTypeClass | (CoordinateValueTypeClass | ErrorTypeClass)[];

export class LocationValueTypeClass extends ValueTypeClass<'locationValue', LocationValueValue> {
    private constructor(value: LocationValueValue | ErrorTypeClass) {
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

        let value: LocationValueValue | ErrorTypeClass;
        if (ctx.GEOLOCATION()) {
            value = isValidClassList(
                ctx.coordinateValue_list(),
                (ctx) => new ValueVisitor().visit(ctx),
                isCoordinateValueType,
                'coordinateValue',
            );
        } else {
            value = ctx.fieldName()
                ? isValidClass(
                      new NameVisitor().visit(ctx.fieldName()),
                      isFieldNameType,
                      'fieldName',
                  )
                : isValidClass(
                      new ExpressionVisitor().visit(ctx.boundExpression()),
                      isBoundExpressionType,
                      'boundExpression',
                  );
        }

        return new LocationValueTypeClass(value);
    }
}

export const isLocationValueType = (
    target: CommonTypeClass<string>,
): target is LocationValueTypeClass => {
    return target instanceof LocationValueTypeClass;
};
