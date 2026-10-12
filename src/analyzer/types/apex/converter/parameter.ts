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

import { toPrimitiveValue, toTypeClass, CommonClass, isCommonClass } from './commons';
import { normalIdConvert } from './id';
import { formalParameterListConvert } from './list';
import { NormalModifierClass, normalModifierConvert } from './modifier';
import { TypeRefClass, typeRefConvert } from './type';

export class FormalParameterClass extends CommonClass {
    private value: string | null = null;
    private valueType: TypeRef | null = null;
    private modifier: NormalModifier[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    setValueType(valueType: TypeRef | null) {
        this.valueType = valueType;
    }

    resetModifier(): void {
        this.modifier = [];
    }

    setModifier(modifier: NormalModifier[]): void {
        this.modifier.push(...modifier);
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): TypeRef | null {
        return this.valueType;
    }

    getModifier(): NormalModifier[] {
        return this.modifier;
    }

    copy(commonClass: FormalParameterClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
        this.resetModifier();
        this.setModifier(commonClass.getModifier());
    }
}

const isFormalParameterClass = (target: CommonClass): target is FormalParameterClass => {
    return target instanceof FormalParameterClass;
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
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};
