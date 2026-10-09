import {
    CommonTypeClass,
    ErrorTypeClass,
    NormalLiteralTypeClass,
    WhenLiteralTypeClass,
    SoqlLiteralTypeClass,
    SoslLiteralTypeClass,
    SoslLiteralAltTypeClass,
    SignedIntegerTypeClass,
    SignedNumberTypeClass,
    isQualifiedNameType,
    isNormalQueryType,
    isBoundExpressionType,
    isSoslClausesType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { QualifiedName, qualifiedNameConvert } from './name';
import { BoundExpression, boundExpressionConvert } from './expression';
import { NormalQuery, normalQueryConvert } from './query';
import { SoslClauses, soslClausesConvert } from './clause';

export type NormalLiteral = {
    value: string | undefined;
    valueType: string | undefined;
};

export const normalLiteralConvert = (
    target: NormalLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): NormalLiteral => {
    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );

    const valueType = toPrimitiveValue(
        target.getValueType(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );

    return {
        value: value,
        valueType: valueType,
    };
};

export type WhenLiteral = {
    value: string | number | QualifiedName | undefined;
    valueType: string | undefined;
    operator: string | undefined;
};

export const whenLiteralConvert = (
    target: WhenLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): WhenLiteral => {
    const valueType = toPrimitiveValue(
        target.getValueType(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    const operator = target.getOperator();

    const valueTypeClass = target.getValue();

    let value: WhenLiteral['value'] = undefined;
    if (!(valueTypeClass instanceof CommonTypeClass)) {
        value = valueTypeClass ?? undefined;
    } else {
        const nameTypeClass = toTypeClass(valueTypeClass, isQualifiedNameType, errorClass);
        value = nameTypeClass ? qualifiedNameConvert(nameTypeClass, errorClass) : undefined;
    }

    return {
        value: value,
        valueType: valueType,
        operator: operator !== '' ? operator : undefined,
    };
};

export type SoqlLiteral = NormalQuery | undefined;

export const soqlLiteralConvert = (
    target: SoqlLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): SoqlLiteral => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalQueryType, errorClass);
    return valueTypeClass ? normalQueryConvert(valueTypeClass, errorClass) : undefined;
};

export type SoslLiteral = {
    value: string | BoundExpression;
    soslClauses: SoslClauses | undefined;
};

export const soslLiteralConvert = (
    target: SoslLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): SoslLiteral => {
    const valueTypeClass = target.getValue();
    const soslClausesTypeClass = toTypeClass(
        target.getSoslClauses(),
        isSoslClausesType,
        errorClass,
    );

    let value: SoslLiteral['value'] = undefined;
    if (!(valueTypeClass instanceof CommonTypeClass)) {
        value = valueTypeClass;
    } else {
        const boundTypeClass = toTypeClass(valueTypeClass, isBoundExpressionType, errorClass);
        value = boundTypeClass ? boundExpressionConvert(boundTypeClass, errorClass) : undefined;
    }

    return {
        value: value,
        soslClauses: soslClausesTypeClass
            ? soslClausesConvert(soslClausesTypeClass, errorClass)
            : undefined,
    };
};

export type SoslLiteralAlt = {
    value: string | undefined;
    soslClauses: SoslClauses | undefined;
};

export const soslLiteralAltConvert = (
    target: SoslLiteralAltTypeClass,
    errorClass: ErrorTypeClass[],
): SoslLiteralAlt => {
    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    const soslClausesTypeClass = toTypeClass(
        target.getSoslClauses(),
        isSoslClausesType,
        errorClass,
    );

    return {
        value: value,
        soslClauses: soslClausesTypeClass
            ? soslClausesConvert(soslClausesTypeClass, errorClass)
            : undefined,
    };
};

export type SignedInteger = {
    value: string | undefined;
    valueType: string | undefined;
    operator: string | undefined;
};

export const signedIntegerConvert = (
    target: SignedIntegerTypeClass,
    errorClass: ErrorTypeClass[],
): SignedInteger => {
    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );

    const valueType = target.getValueType() ?? undefined;
    const operator = target.getOperator() ?? undefined;

    return {
        value: value,
        valueType: valueType,
        operator: operator ? operator : undefined,
    };
};

export type SignedNumber = {
    value: string | undefined;
    valueType: string | undefined;
    operator: string | undefined;
};

export const signedNumberConvert = (
    target: SignedNumberTypeClass,
    errorClass: ErrorTypeClass[],
): SignedNumber => {
    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );

    const valueType = target.getValueType() ?? undefined;
    const operator = target.getOperator() ?? undefined;

    return {
        value: value,
        valueType: valueType,
        operator: operator ? operator : undefined,
    };
};
