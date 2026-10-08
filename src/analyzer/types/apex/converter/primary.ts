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
import { NormalId, normalIdConvert } from './id';
import { typeRefConvert, TypeRef } from './type';
import { NormalLiteral, normalLiteralConvert } from './literal';

export type NormalPrimary = string | null;

export const normalPrimaryConvert = (
    target: NormalPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): NormalPrimary => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export type ThisPrimary = string | null;

export const thisPrimaryConvert = (
    target: ThisPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): ThisPrimary => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export type VoidPrimary = string | null;

export const voidPrimaryConvert = (
    target: VoidPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): VoidPrimary => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

type SoqlPrimary = SoqlLiteralTypeClass | null;

export const soqlPrimaryConvert = (
    target: SoqlPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): SoqlPrimary => {
    return toTypeClass(target.getValue(), isSoqlLiteralType, errorClass);
};

export type SuperPrimary = string | null;

export const superPrimaryConvert = (
    target: SuperPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): SuperPrimary => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export type TypeRefPrimary = TypeRef | null;

export const typeRefPrimaryConvert = (
    target: TypeRefPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): TypeRefPrimary => {
    const typeClass = toTypeClass(target.getValue(), isTypeRefType, errorClass);
    if (typeClass) {
        return typeRefConvert(typeClass, errorClass);
    }

    return null;
};

export type IdPrimary = NormalId | null;

export const idPrimaryConvert = (
    target: IdPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): IdPrimary => {
    const normalIdType = toTypeClass(target.getValue(), isNormalIdType, errorClass);

    if (normalIdType) {
        return normalIdConvert(normalIdType);
    }
    return null;
};

export type LiteralPrimary = NormalLiteral | null;

export const literalPrimaryConvert = (
    target: LiteralPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): LiteralPrimary => {
    const typeClass = toTypeClass(target.getValue(), isNormalLiteralType, errorClass);
    if (typeClass) {
        return normalLiteralConvert(typeClass, errorClass);
    }

    return null;
};

export type SoslPrimary = SoslLiteralTypeClass | null;

export const soslPrimaryConvert = (
    target: SoslPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): SoslPrimary => {
    return toTypeClass(target.getValue(), isSoslLiteralType, errorClass);
};

export type Primary =
    | NormalPrimary
    | ThisPrimary
    | VoidPrimary
    | SoqlPrimary
    | SuperPrimary
    | TypeRefPrimary
    | IdPrimary
    | LiteralPrimary
    | SoslPrimary
    | null;

export const primaryConvert = (
    target: PrimaryTypeClass<unknown>,
    errorClass: ErrorTypeClass[],
): Primary => {
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
