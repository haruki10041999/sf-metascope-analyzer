import { LocationValueContext } from '@apexdevtools/apex-parser';

import { CoordinateValueTypeClass, ValueTypeClass, ValueVisitor, isCoordinateValueType } from '.';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

type LocationValueValue =
    FieldNameTypeClass | BoundExpressionTypeClass | (CoordinateValueTypeClass | null)[];

export class LocationValueTypeClass extends ValueTypeClass<LocationValueValue> {
    private isGeoLocation: boolean;
    private constructor(
        value: LocationValueValue | null,
        isGeoLocation: boolean,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('locationValue', value, errorClasses);
        this.isGeoLocation = isGeoLocation;
    }

    static create(ctx: LocationValueContext): LocationValueTypeClass {
        if (
            !ctx.fieldName() &&
            !ctx.boundExpression() &&
            (!ctx.coordinateValue_list() || ctx.coordinateValue_list().length !== 2)
        ) {
            throw new Error('値が異常です。LocationValueContext: ' + ctx.getText());
        }

        let value: LocationValueValue | null = null;
        let isGeoLocation: boolean = false;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        if (ctx.fieldName()) {
            const nameTypeClass = new NameVisitor().visit(ctx.fieldName());
            if (isFieldNameType(nameTypeClass)) {
                value = nameTypeClass;
            } else if (isErrorType(nameTypeClass)) {
                errorClasses['value'] = nameTypeClass;
            }
        }

        if (ctx.boundExpression()) {
            const expressionTypeClass = new ExpressionVisitor().visit(ctx.boundExpression());
            if (isBoundExpressionType(expressionTypeClass)) {
                value = expressionTypeClass;
            } else if (isErrorType(expressionTypeClass)) {
                errorClasses['value'] = expressionTypeClass;
            }
        }

        if (ctx.coordinateValue_list()) {
            const coordinateValues: (CoordinateValueTypeClass | null)[] = [];
            ctx.coordinateValue_list().forEach((coordinateValueCtx, index) => {
                const valueTypeClass = new ValueVisitor().visit(coordinateValueCtx);
                if (isCoordinateValueType(valueTypeClass)) {
                    coordinateValues.push(valueTypeClass);
                    return valueTypeClass;
                } else if (isErrorType(valueTypeClass)) {
                    errorClasses['value'] = valueTypeClass;
                    return null;
                }
            });

            value = coordinateValues;

            if (ctx.GEOLOCATION()) {
                isGeoLocation = true;
            }
        }

        return new LocationValueTypeClass(value, isGeoLocation, errorClasses);
    }
}

export const isLocationValueType = (target: CommonTypeClass): target is LocationValueTypeClass => {
    return target instanceof LocationValueTypeClass;
};

