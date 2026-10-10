import {
    CommonTypeClass,
    ErrorTypeClass,
    NormalValueTypeClass,
    ElementValueTypeClass,
    WhenValueTypeClass,
    CoordinateValueTypeClass,
    LocationValueTypeClass,
    isCoordinateValueType,
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
    isTypeRefType,
    isWhenLiteralType,
    isNormalIdType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { normalIdConvert } from './id';
import { Expression, boundExpressionConvert } from './expression';
import {
    NormalLiteral,
    normalLiteralConvert,
    SignedLiteral,
    signedNumberConvert,
    WhenLiteral,
    whenLiteralConvert,
} from './literal';
import { fieldNameConvert } from './name';
import { valueListConvert } from './list';
import { TypeRef, typeRefConvert } from './type';
import { DateFormula, dateFormulaConvert, SubQuery, subQueryConvert } from './query';

export const coordinateValueConvert = (
    target: CoordinateValueTypeClass,
    errorClass: ErrorTypeClass[],
): SignedLiteral | Expression | undefined => {
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

    return undefined;
};

export const elementValueConvert = (
    target: ElementValueTypeClass,
    errorClass: ErrorTypeClass[],
): NormalLiteral | undefined => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalLiteralType, errorClass);
    if (valueTypeClass) {
        return normalLiteralConvert(valueTypeClass, errorClass);
    }
    return undefined;
};

export const locationValueConvert = (
    target: LocationValueTypeClass,
    errorClass: ErrorTypeClass[],
): (SignedLiteral | Expression)[] | string[] | Expression | undefined => {
    const value = target.getValue();
    const coordinates = target.getCoordinates();

    if (coordinates && coordinates.length > 0) {
        const values: (SignedLiteral | Expression)[] = [];
        coordinates.forEach((coordinate) => {
            const typeClass = toTypeClass(coordinate, isCoordinateValueType, errorClass);
            if (typeClass) {
                const coordinateValue = coordinateValueConvert(typeClass, errorClass);
                if (coordinateValue) {
                    values.push(coordinateValue);
                }
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

    return undefined;
};

export type NormalValue = {
    value?: string | SignedLiteral | NormalValue[] | DateFormula | SubQuery | Expression;
    valueType: string;
};

export const normalValueConvert = (
    target: NormalValueTypeClass,
    errorClass: ErrorTypeClass[],
): NormalValue => {
    const normalValue: NormalValue = {
        valueType: target.getValueType(),
    };

    const valueTypeClass = target.getValue();

    if (typeof valueTypeClass === 'string') {
        normalValue.value = valueTypeClass;
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
                normalValue.value = signedNumberConvert(typeClass, errorClass);
            }
            if (isValueListType(typeClass)) {
                normalValue.value = valueListConvert(typeClass, errorClass);
            }
            if (isDateFormulaType(typeClass)) {
                normalValue.value = dateFormulaConvert(typeClass, errorClass);
            }
            if (isSubQueryType(typeClass)) {
                normalValue.value = subQueryConvert(typeClass, errorClass);
            }
            if (isBoundExpressionType(typeClass)) {
                const expression = boundExpressionConvert(typeClass, errorClass);
                if (expression) {
                    normalValue.value = expression;
                }
            }
        }
    }

    return normalValue;
};

export type WhenValue = {
    value?: string | WhenLiteral[];
    valueType: TypeRef;
};

export const whenValueConvert = (
    target: WhenValueTypeClass,
    errorClass: ErrorTypeClass[],
): WhenValue => {
    const whenValue: WhenValue = {
        valueType: {
            value: [],
        },
    };

    const valueTypeClass = target.getValue();
    if (typeof valueTypeClass === 'string') {
        whenValue.value = valueTypeClass;
    } else if (Array.isArray(valueTypeClass)) {
        const values: WhenLiteral[] = [];
        valueTypeClass.forEach((whenliteralTypeClass) => {
            const typeClass = toTypeClass(whenliteralTypeClass, isWhenLiteralType, errorClass);
            if (typeClass) {
                const whenLiteral = whenLiteralConvert(typeClass, errorClass);
                if (whenLiteral) {
                    values.push(whenLiteral);
                }
            }
        });
        whenValue.value = values;
    } else {
        const typeClass = toTypeClass(valueTypeClass, isNormalIdType, errorClass);
        if (typeClass) {
            whenValue.value = normalIdConvert(typeClass);
        }
    }

    const valueTypeTypeClass = target.getValueType();
    if (valueTypeTypeClass) {
        const typeClass = toTypeClass(valueTypeTypeClass, isTypeRefType, errorClass);
        if (typeClass) {
            const typeRef = typeRefConvert(typeClass, errorClass);
            if (typeRef) {
                whenValue.valueType.value.push(...typeRef.value);
                if (typeRef.dimension) {
                    whenValue.valueType.dimension = typeRef.dimension;
                }
            }
        }
    }

    return whenValue;
};
