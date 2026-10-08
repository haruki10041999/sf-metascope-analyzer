import {
    ErrorTypeClass,
    PrimaryTypeClass,
    NormalPrimaryTypeClass,
    ThisPrimaryTypeClass,
    VoidPrimaryTypeClass,
    SoqlPrimaryTypeClass,
    SuperPrimaryTypeClass,
    TypeRefPrimaryTypeClass,
    IdPrimaryTypeClass,
    LiteralPrimaryTypeClass,
    SoslPrimaryTypeClass,
    isNormalPrimaryType,
    isThisPrimaryType,
    isVoidPrimaryType,
    isSoqlPrimaryType,
    isSuperPrimaryType,
    isTypeRefPrimaryType,
    isIdPrimaryType,
    isLiteralPrimaryType,
    isSoslPrimaryType,
    SoqlLiteralTypeClass,
    TypeRefTypeClass,
    NormalLiteralTypeClass,
    SoslLiteralTypeClass,
    isNormalIdType,
    isSoqlLiteralType,
    isTypeRefType,
    isNormalLiteralType,
    isSoslLiteralType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { normalIdConvert } from './id';

export const normalPrimaryConvert = (
    target: NormalPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const thisPrimaryConvert = (
    target: ThisPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const voidPrimaryConvert = (
    target: VoidPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const soqlPrimaryConvert = (
    target: SoqlPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): SoqlLiteralTypeClass | null => {
    return toTypeClass(target.getValue(), isSoqlLiteralType, errorClass);
};

export const superPrimaryConvert = (
    target: SuperPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const typeRefPrimaryConvert = (
    target: TypeRefPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): TypeRefTypeClass | null => {
    return toTypeClass(target.getValue(), isTypeRefType, errorClass);
};

export const idPrimaryConvert = (
    target: IdPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    const normalIdType = toTypeClass(target.getValue(), isNormalIdType, errorClass);

    if (normalIdType) {
        return normalIdConvert(normalIdType);
    }
    return null;
};

export const literalPrimaryConvert = (
    target: LiteralPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): NormalLiteralTypeClass | null => {
    return toTypeClass(target.getValue(), isNormalLiteralType, errorClass);
};

export const soslPrimaryConvert = (
    target: SoslPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): SoslLiteralTypeClass | null => {
    return toTypeClass(target.getValue(), isSoslLiteralType, errorClass);
};

export const primaryConvert = (target: PrimaryTypeClass<unknown>, errorClass: ErrorTypeClass[]) => {
    if (isNormalPrimaryType(target)) {
        return normalPrimaryConvert(target, errorClass);
    }
    if (isThisPrimaryType(target)) {
        return thisPrimaryConvert(target, errorClass);
    }
    if (isVoidPrimaryType(target)) {
        return voidPrimaryConvert(target, errorClass);
    }
    if (isSoqlPrimaryType(target)) {
        return soqlPrimaryConvert(target, errorClass);
    }
    if (isSuperPrimaryType(target)) {
        return superPrimaryConvert(target, errorClass);
    }
    if (isTypeRefPrimaryType(target)) {
        return typeRefPrimaryConvert(target, errorClass);
    }
    if (isIdPrimaryType(target)) {
        return idPrimaryConvert(target, errorClass);
    }
    if (isLiteralPrimaryType(target)) {
        return literalPrimaryConvert(target, errorClass);
    }
    if (isSoslPrimaryType(target)) {
        return soslPrimaryConvert(target, errorClass);
    }

    return null;
};
