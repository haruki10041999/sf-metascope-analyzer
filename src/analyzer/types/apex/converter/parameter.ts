import {
    ErrorTypeClass,
    FormalParameterTypeClass,
    FormalParametersTypeClass,
    SoqlFieldsParameterTypeClass,
    isFormalParameterListType,
    isNormalIdType,
    isTypeRefType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { NormalId, normalIdConvert } from './id';
import { FormalParameterList, formalParameterListConvert } from './list';
import { NormalModifier, normalModifierListConvert } from './modifier';
import { TypeRef, typeRefConvert } from './type';

export type FormalParameter = {
    value: NormalId | undefined;
    valueType: TypeRef | undefined;
    modifier: NormalModifier[] | undefined;
};

export const formalParameterConvert = (
    target: FormalParameterTypeClass,
    errorClass: ErrorTypeClass[],
): FormalParameter => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);

    return {
        value: valueTypeClass ? normalIdConvert(valueTypeClass) : undefined,
        valueType: valueTypeTypeClass ? typeRefConvert(valueTypeTypeClass, errorClass) : undefined,
        modifier: normalModifierListConvert(target.getModifier(), errorClass),
    };
};

export type FormalParameters = FormalParameterList;

export const formalParametersConvert = (
    target: FormalParametersTypeClass,
    errorClass: ErrorTypeClass[],
): FormalParameters => {
    const value = target.getValue();
    if (!value) {
        return undefined;
    }

    const listTypeClass = toTypeClass(value, isFormalParameterListType, errorClass);
    return listTypeClass ? formalParameterListConvert(listTypeClass, errorClass) : undefined;
};

export type SoqlFieldsParameter = string | undefined;

export const soqlFieldsParameterConvert = (
    target: SoqlFieldsParameterTypeClass,
    errorClass: ErrorTypeClass[],
): SoqlFieldsParameter => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};
