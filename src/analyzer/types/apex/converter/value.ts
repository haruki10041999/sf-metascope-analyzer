import {
    CommonTypeClass,
    ErrorTypeClass,
    NormalValueTypeClass,
    ElementValueTypeClass,
    WhenValueTypeClass,
    CoordinateValueTypeClass,
    LocationValueTypeClass,
    isNormalValueType,
    isElementValueType,
    isWhenValueType,
    isCoordinateValueType,
    isLocationValueType,
    isFieldNameType,
    SignedNumberTypeClass,
    FieldNameTypeClass,
    BoundExpressionTypeClass,
    isSignedNumberType,
    isBoundExpressionType,
    isNormalLiteralType,
    DateFormulaTypeClass,
    SubQueryTypeClass,
    ValueListTypeClass,
    isValueListType,
    isDateFormulaType,
    isSubQueryType,
    TypeRefTypeClass,
    isTypeRefType,
    isWhenLiteralType,
    NormalIdTypeClass,
    isNormalIdType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { normalIdConvert } from './id';
import { boundExpressionConvert } from './expression';
import { normalLiteralConvert, signedNumberConvert, whenLiteralConvert } from './literal';
import { fieldNameConvert } from './name';
import { valueListConvert } from './list';

export const coordinateValueConvert = (
    target: CoordinateValueTypeClass,
    errorClass: ErrorTypeClass[],
) => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is SignedNumberTypeClass | BoundExpressionTypeClass =>
            isSignedNumberType(target) || isBoundExpressionType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isSignedNumberType(valueTypeClass)) {
            return signedNumberConvert(valueTypeClass, errorClass);
        }
        if (isBoundExpressionType(valueTypeClass)) {
            return boundExpressionConvert(valueTypeClass, errorClass);
        }
    }

    return valueTypeClass;
};

export const elementValueConvert = (
    target: ElementValueTypeClass,
    errorClass: ErrorTypeClass[],
) => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalLiteralType, errorClass);

    if (valueTypeClass) {
        return normalLiteralConvert(valueTypeClass, errorClass);
    }

    return valueTypeClass;
};

export const locationValueConvert = (
    target: LocationValueTypeClass,
    errorClass: ErrorTypeClass[],
): any => {
    const value = target.getValue();
    const coordinates = target.getCoordinates();

    if (coordinates && coordinates.length > 0) {
        const values: any[] = [];
        coordinates.forEach((coordinate) => {
            const typeClass = toTypeClass(coordinate, isCoordinateValueType, errorClass);
            if (typeClass) {
                values.push(typeClass);
            }
        });
        return values;
    }

    if (value) {
        const typeClass = toTypeClass(
            value,
            (target): target is FieldNameTypeClass | BoundExpressionTypeClass =>
                isFieldNameType(target) || isBoundExpressionType(target),
            errorClass,
        );

        if (typeClass) {
            if (isFieldNameType(typeClass)) {
                return fieldNameConvert(typeClass, errorClass);
            }
            if (isBoundExpressionType(typeClass)) {
                return boundExpressionConvert(typeClass, errorClass);
            }
        }
    }

    return null;
};

export const normalValueConvert = (
    target: NormalValueTypeClass,
    errorClass: ErrorTypeClass[],
): any => {
    const valueTypeClass = target.getValue();

    let value;
    if (!(valueTypeClass instanceof CommonTypeClass)) {
        value = valueTypeClass;
    } else {
        const typeClass = toTypeClass(
            valueTypeClass,
            (
                target,
            ): target is
                | SignedNumberTypeClass
                | ValueListTypeClass
                | DateFormulaTypeClass
                | SubQueryTypeClass
                | BoundExpressionTypeClass =>
                isSignedNumberType(target) ||
                isValueListType(target) ||
                isDateFormulaType(target) ||
                isSubQueryType(target) ||
                isBoundExpressionType(target),
            errorClass,
        );

        if (typeClass) {
            if (isSignedNumberType(typeClass)) {
                value = signedNumberConvert(typeClass, errorClass);
            }
            if (isValueListType(typeClass)) {
                value = valueListConvert(typeClass, errorClass);
            }
            if (isDateFormulaType(typeClass)) {
                value = typeClass;
            }
            if (isSubQueryType(typeClass)) {
                value = typeClass;
            }
            if (isBoundExpressionType(typeClass)) {
                value = boundExpressionConvert(typeClass, errorClass);
            }
        }
    }

    return {
        value: value,
        valueType: target.getValueType(),
    };
};

export const whenValueConvert = (target: WhenValueTypeClass, errorClass: ErrorTypeClass[]): any => {
    const valueTypeClass = target.getValue();

    let value;
    let valueType;
    if (typeof valueTypeClass === 'string') {
        value = valueTypeClass;
    } else if (Array.isArray(valueTypeClass)) {
        const values: any[] = [];
        valueTypeClass.forEach((item) => {
            const typeClass = toTypeClass(item, isWhenLiteralType, errorClass);
            if (typeClass) {
                values.push(whenLiteralConvert(typeClass, errorClass));
            }
        });
        value = values;
    } else {
        const typeClass = toTypeClass(valueTypeClass, isNormalIdType, errorClass);
        if (typeClass) {
            value = normalIdConvert(typeClass);
        }

        const valueTypeClas = target.getValueType();
        if (valueTypeClas) {
            valueType = toTypeClass(valueTypeClas, isTypeRefType, errorClass);
        }
    }

    return {
        value: value,
        valueType: valueType,
    };
};
