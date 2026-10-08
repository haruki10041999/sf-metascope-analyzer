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
    NormalQueryTypeClass,
    SoslClausesTypeClass,
    isQualifiedNameType,
    isNormalQueryType,
    isBoundExpressionType,
    isSoslClausesType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { qualifiedNameConvert } from './name';

export type NormalLiteral = {
    value: string | null;
    valueType: string | null;
};

export const normalLiteralConvert = (
    target: NormalLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): { value: any; valueType: any } => {
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

export type WhenLiteral = {};

export const whenLiteralConvert = (
    target: WhenLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): { value: any; valueType: any; operator: any } => {
    const valueType = toPrimitiveValue(
        target.getValueType(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    const operator = target.getOperator();

    const valueTypeClass = target.getValue();

    let value: any = null;
    if (!(valueTypeClass instanceof CommonTypeClass)) {
        value = valueTypeClass;
    } else {
        if (isQualifiedNameType(valueTypeClass)) {
            value = qualifiedNameConvert(valueTypeClass, errorClass);
        }
        value = valueTypeClass;
    }

    return {
        value: value,
        valueType: valueType,
        operator: operator !== '' ? operator : null,
    };
};

export type SoqlLiteral = NormalQueryTypeClass | null;

export const soqlLiteralConvert = (
    target: SoqlLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): SoqlLiteral => {
    return toTypeClass(target.getValue(), isNormalQueryType, errorClass);
};

type Sosl

export const soslLiteralConvert = (
    target: SoslLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): { value: any; soslClauses: SoslClausesTypeClass | null } | null => {
    const valueTypeClass = target.getValue();
    const soslClauses = toTypeClass(target.getSoslClauses(), isSoslClausesType, errorClass);

    let value: any = null;
    if (!(valueTypeClass instanceof CommonTypeClass)) {
        value = valueTypeClass;
    } else {
        if (isBoundExpressionType(valueTypeClass)) {
            value = valueTypeClass;
        }
        value = valueTypeClass;
    }

    return {
        value: value,
        soslClauses: soslClauses,
    };
};

export const soslLiteralAltConvert = (
    target: SoslLiteralAltTypeClass,
    errorClass: ErrorTypeClass[],
): { value: string | null; soslClauses: SoslClausesTypeClass | null } | null => {
    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    const soslClauses = toTypeClass(target.getSoslClauses(), isSoslClausesType, errorClass);

    return {
        value: value,
        soslClauses: soslClauses,
    };
};

export const signedIntegerConvert = (
    target: SignedIntegerTypeClass,
    errorClass: ErrorTypeClass[],
): { value: string | null; valueType: string | null; operator: string | null } => {
    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );

    const valueType = target.getValueType();
    const operator = target.getOperator();

    return {
        value: value,
        valueType: valueType,
        operator: operator ? operator : null,
    };
};

export const signedNumberConvert = (
    target: SignedNumberTypeClass,
    errorClass: ErrorTypeClass[],
): { value: string | null; valueType: string | null; operator: string | null } => {
    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );

    const valueType = target.getValueType();
    const operator = target.getOperator();

    return {
        value: value,
        valueType: valueType,
        operator: operator ? operator : null,
    };
};
