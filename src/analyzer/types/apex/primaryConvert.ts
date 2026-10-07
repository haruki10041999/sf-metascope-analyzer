import {
    CommonTypeClass,
    IdPrimaryTypeClass,
    LiteralPrimaryTypeClass,
    NormalPrimaryTypeClass,
    SoqlPrimaryTypeClass,
    SoslPrimaryTypeClass,
    SuperPrimaryTypeClass,
    ThisPrimaryTypeClass,
    TypeRefPrimaryTypeClass,
    VoidPrimaryTypeClass,
    isIdPrimaryType,
    isLiteralPrimaryType,
    isNormalPrimaryType,
    isSoqlPrimaryType,
    isSoslPrimaryType,
    isSuperPrimaryType,
    isThisPrimaryType,
    isTypeRefPrimaryType,
    isVoidPrimaryType,
    ErrorTypeClass,
    TypeRefTypeClass,
    NormalLiteralTypeClass,
    SoslLiteralTypeClass,
    SoqlLiteralTypeClass,
    NormalIdTypeClass,
    isErrorType,
    isNormalIdType,
    isNormalLiteralType,
    isSoqlLiteralType,
    isNormalQueryType,
    isSoslLiteralType,
    isSoslClausesType,
} from '../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';

export const primaryConvert = (typeClass: CommonTypeClass, errorClasses: ErrorTypeClass[]) => {
    if (isErrorType(typeClass)) {
        errorClasses.push(typeClass as ErrorTypeClass);
        return null;
    }

    let value = null;
    if (isIdPrimaryType(typeClass)) {
        const value = toTypeClass(typeClass.getValue(), isNormalIdType, errorClasses);
        if (value) {
            return value.getValue();
        }
    }

    if (isLiteralPrimaryType(typeClass)) {
        const value = toTypeClass(typeClass.getValue(), isNormalLiteralType, errorClasses);
        if (value) {
            return { type: value.getValueType(), value: value.getValue() };
        }
    }

    if (isNormalPrimaryType(typeClass)) {
        return toPrimitiveValue(
            typeClass.getValue(),
            (target): target is string => {
                return typeof target === 'string';
            },
            errorClasses,
        );
    }

    if (isSoqlPrimaryType(typeClass)) {
        const literalTypeClass = toTypeClass(typeClass.getValue(), isSoqlLiteralType, errorClasses);
        if (literalTypeClass) {
            return toTypeClass(literalTypeClass.getValue(), isNormalQueryType, errorClasses);
        }
    }

    if (isSoslPrimaryType(typeClass)) {
        const literalTypeClass = toTypeClass(typeClass.getValue(), isSoslLiteralType, errorClasses);
        if (literalTypeClass) {
            return toTypeClass(literalTypeClass.getValue(), isSoslClausesType, errorClasses);
        }
    }

    if (isSuperPrimaryType(typeClass)) {
        value = (typeClass as SuperPrimaryTypeClass).getValue() as string;
    }

    if (isThisPrimaryType(typeClass)) {
        value = (typeClass as ThisPrimaryTypeClass).getValue() as string;
    }

    if (isTypeRefPrimaryType(typeClass)) {
        value = (typeClass as TypeRefPrimaryTypeClass).getValue() as
            TypeRefTypeClass | ErrorTypeClass;
    }

    if (isVoidPrimaryType(typeClass)) {
        value = (typeClass as VoidPrimaryTypeClass).getValue() as string;
    }

    if (value && value instanceof CommonTypeClass && isErrorType(value)) {
        errorClasses.push(value as ErrorTypeClass);
        return null;
    }

    return value;
};
