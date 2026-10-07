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
} from '../apex_IR';

export const primaryConvert = (typeClass: CommonTypeClass, errorClasses: ErrorTypeClass[]) => {
    if (isErrorType(typeClass)) {
        errorClasses.push(typeClass as ErrorTypeClass);
        return null;
    }

    let value = null;
    if (isIdPrimaryType(typeClass)) {
        value = (typeClass as IdPrimaryTypeClass).getValue() as NormalIdTypeClass | ErrorTypeClass;
    }

    if (isLiteralPrimaryType(typeClass)) {
        value = (typeClass as LiteralPrimaryTypeClass).getValue() as
            NormalLiteralTypeClass | ErrorTypeClass;
    }

    if (isNormalPrimaryType(typeClass)) {
        value = (typeClass as NormalPrimaryTypeClass).getValue() as string;
    }

    if (isSoqlPrimaryType(typeClass)) {
        value = (typeClass as SoqlPrimaryTypeClass).getValue() as
            SoqlLiteralTypeClass | ErrorTypeClass;
    }

    if (isSoslPrimaryType(typeClass)) {
        value = (typeClass as SoslPrimaryTypeClass).getValue() as
            SoslLiteralTypeClass | ErrorTypeClass;
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
