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
    isNormalIdType,
    isSoqlLiteralType,
    isTypeRefType,
    isNormalLiteralType,
    isSoslLiteralType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { NormalId, normalIdConvert } from './id';
import { typeRefConvert, TypeRef } from './type';
import {
    NormalLiteral,
    normalLiteralConvert,
    SoqlLiteral,
    soqlLiteralConvert,
    SoslLiteral,
    soslLiteralConvert,
} from './literal';

export type NormalPrimary = string | undefined;

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

export type ThisPrimary = string | undefined;

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

export type VoidPrimary = string | undefined;

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

export type SoqlPrimary = SoqlLiteral;

export const soqlPrimaryConvert = (
    target: SoqlPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): SoqlPrimary => {
    const valueTypeClass = toTypeClass(target.getValue(), isSoqlLiteralType, errorClass);
    return valueTypeClass ? soqlLiteralConvert(valueTypeClass, errorClass) : undefined;
};

export type SuperPrimary = string | undefined;

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

export type TypeRefPrimary = TypeRef | undefined;

export const typeRefPrimaryConvert = (
    target: TypeRefPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): TypeRefPrimary => {
    const typeClass = toTypeClass(target.getValue(), isTypeRefType, errorClass);
    if (typeClass) {
        return typeRefConvert(typeClass, errorClass);
    }

    return undefined;
};

export type IdPrimary = NormalId | undefined;

export const idPrimaryConvert = (
    target: IdPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): IdPrimary => {
    const normalIdType = toTypeClass(target.getValue(), isNormalIdType, errorClass);

    if (normalIdType) {
        return normalIdConvert(normalIdType);
    }
    return undefined;
};

export type LiteralPrimary = NormalLiteral | undefined;

export const literalPrimaryConvert = (
    target: LiteralPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): LiteralPrimary => {
    const typeClass = toTypeClass(target.getValue(), isNormalLiteralType, errorClass);
    if (typeClass) {
        return normalLiteralConvert(typeClass, errorClass);
    }

    return undefined;
};

export type SoslPrimary = SoslLiteral | undefined;

export const soslPrimaryConvert = (
    target: SoslPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): SoslPrimary => {
    const valueTypeClass = toTypeClass(target.getValue(), isSoslLiteralType, errorClass);
    return valueTypeClass ? soslLiteralConvert(valueTypeClass, errorClass) : undefined;
};

export type Primary =
    | {
          type: string;
          primary:
              | NormalPrimary
              | ThisPrimary
              | VoidPrimary
              | SoqlPrimary
              | SuperPrimary
              | TypeRefPrimary
              | IdPrimary
              | LiteralPrimary
              | SoslPrimary;
      }
    | undefined;

export const primaryConvert = (
    target: PrimaryTypeClass<unknown>,
    errorClass: ErrorTypeClass[],
): Primary => {
    if (isNormalPrimaryType(target)) {
        return {
            type: 'normal',
            primary: normalPrimaryConvert(target, errorClass),
        };
    }
    if (isThisPrimaryType(target)) {
        return {
            type: 'this',
            primary: thisPrimaryConvert(target, errorClass),
        };
    }
    if (isVoidPrimaryType(target)) {
        return {
            type: 'void',
            primary: voidPrimaryConvert(target, errorClass),
        };
    }
    if (isSoqlPrimaryType(target)) {
        return {
            type: 'soql',
            primary: soqlPrimaryConvert(target, errorClass),
        };
    }
    if (isSuperPrimaryType(target)) {
        return {
            type: 'super',
            primary: superPrimaryConvert(target, errorClass),
        };
    }
    if (isTypeRefPrimaryType(target)) {
        return {
            type: 'typeRef',
            primary: typeRefPrimaryConvert(target, errorClass),
        };
    }
    if (isIdPrimaryType(target)) {
        return {
            type: 'id',
            primary: idPrimaryConvert(target, errorClass),
        };
    }
    if (isLiteralPrimaryType(target)) {
        return {
            type: 'literal',
            primary: literalPrimaryConvert(target, errorClass),
        };
    }
    if (isSoslPrimaryType(target)) {
        return {
            type: 'sosl',
            primary: soslPrimaryConvert(target, errorClass),
        };
    }

    return undefined;
};
