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
import { NormalId, normalIdConvert } from './id';
import { BoundExpression, boundExpressionConvert } from './expression';
import {
    NormalLiteral,
    normalLiteralConvert,
    SignedNumber,
    signedNumberConvert,
    WhenLiteral,
    whenLiteralConvert,
} from './literal';
import { FieldName, fieldNameConvert } from './name';
import { ValueList, valueListConvert } from './list';
import { TypeRef, typeRefConvert } from './type';
import { DateFormula, dateFormulaConvert, SubQuery, subQueryConvert } from './query';

export type CoordinateValue = SignedNumber | BoundExpression | undefined;

export const coordinateValueConvert = (
    target: CoordinateValueTypeClass,
    errorClass: ErrorTypeClass[],
): CoordinateValue => {
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

export type ElementValue = NormalLiteral | undefined;

export const elementValueConvert = (
    target: ElementValueTypeClass,
    errorClass: ErrorTypeClass[],
): ElementValue => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalLiteralType, errorClass);
    return valueTypeClass ? normalLiteralConvert(valueTypeClass, errorClass) : undefined;
};

export type LocationValue = CoordinateValue[] | FieldName | BoundExpression | undefined;

export const locationValueConvert = (
    target: LocationValueTypeClass,
    errorClass: ErrorTypeClass[],
): LocationValue => {
    const value = target.getValue();
    const coordinates = target.getCoordinates();

    if (coordinates && coordinates.length > 0) {
        const values: CoordinateValue[] = [];
        coordinates.forEach((coordinate) => {
            const typeClass = toTypeClass(coordinate, isCoordinateValueType, errorClass);
            if (typeClass) {
                values.push(coordinateValueConvert(typeClass, errorClass));
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
    value: string | SignedNumber | ValueList | DateFormula | SubQuery | BoundExpression | undefined;

    valueType: string;
};

export const normalValueConvert = (
    target: NormalValueTypeClass,
    errorClass: ErrorTypeClass[],
): NormalValue => {
    const valueTypeClass = target.getValue();

    let value: NormalValue['value'] = undefined;
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
                value = dateFormulaConvert(typeClass, errorClass);
            }
            if (isSubQueryType(typeClass)) {
                value = subQueryConvert(typeClass, errorClass);
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

export type WhenValue = {
    value: string | WhenLiteral[] | NormalId | undefined;
    valueType: TypeRef | undefined;
};

export const whenValueConvert = (
    target: WhenValueTypeClass,
    errorClass: ErrorTypeClass[],
): WhenValue => {
    const valueTypeClass = target.getValue();

    let value: WhenValue['value'] = undefined;
    let valueType: WhenValue['valueType'] = undefined;
    if (typeof valueTypeClass === 'string') {
        value = valueTypeClass;
    } else if (Array.isArray(valueTypeClass)) {
        const values: WhenLiteral[] = [];
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

        const valueTypeTypeClass = target.getValueType();
        if (valueTypeTypeClass) {
            const typeClass = toTypeClass(valueTypeTypeClass, isTypeRefType, errorClass);
            if (typeClass) {
                valueType = typeRefConvert(typeClass, errorClass);
            }
        }
    }

    return {
        value: value,
        valueType: valueType,
    };
};
