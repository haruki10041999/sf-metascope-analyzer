import {
    ErrorTypeClass,
    FormalParameterTypeClass,
    FormalParametersTypeClass,
    SoqlFieldsParameterTypeClass,
    isFormalParameterListType,
    isNormalIdType,
    isNormalModifierType,
    isTypeRefType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { normalIdConvert } from './id';
import { formalParameterListConvert } from './list';
import { NormalModifier, normalModifierConvert } from './modifier';
import { TypeRef, typeRefConvert } from './type';

export type FormalParameter = {
    value?: string;
    valueType: TypeRef;
    modifier: NormalModifier[];
};

export const formalParameterConvert = (
    target: FormalParameterTypeClass,
    errorClass: ErrorTypeClass[],
): FormalParameter => {
    const formalParameter: FormalParameter = {
        valueType: {
            value: [],
        },
        modifier: [],
    };

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        formalParameter.value = normalIdConvert(valueTypeClass);
    }

    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);
    if (valueTypeTypeClass) {
        const typeRef = typeRefConvert(valueTypeTypeClass, errorClass);
        formalParameter.valueType.value.push(...typeRef.value);
        if (typeRef.dimension) {
            formalParameter.valueType.dimension = typeRef.dimension;
        }
    }

    target.getModifier().forEach((m) => {
        const typeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (typeClass) {
            const modifier = normalModifierConvert(typeClass, errorClass);
            if (modifier) {
                formalParameter.modifier.push(modifier);
            }
        }
    });

    return formalParameter;
};

export const formalParametersConvert = (
    target: FormalParametersTypeClass,
    errorClass: ErrorTypeClass[],
): FormalParameter[] => {
    const value = target.getValue();
    if (value) {
        const typeClass = toTypeClass(value, isFormalParameterListType, errorClass);
        if (typeClass) {
            return formalParameterListConvert(typeClass, errorClass);
        }
    }
    return [];
};

export const soqlFieldsParameterConvert = (
    target: SoqlFieldsParameterTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};
