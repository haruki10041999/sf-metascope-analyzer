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
    private valueType: TypeRefClass = new TypeRefClass();
    private modifier: NormalModifierClass[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    setValueType(valueType: TypeRefClass) {
        this.valueType.copy(valueType);
    }

    resetModifier(): void {
        this.modifier = [];
    }

    setModifier(modifier: NormalModifierClass[]): void {
        this.modifier.push(...modifier);
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): TypeRefClass {
        return this.valueType;
    }

    getModifier(): NormalModifierClass[] {
        return this.modifier;
    }

    copy(commonClass: FormalParameterClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
        this.resetModifier();
        this.setModifier(commonClass.getModifier());
    }
}

export const isFormalParameterClass = (target: any): target is FormalParameterClass => {
    return isCommonClass(target, FormalParameterClass);
};

export const isFormalParameterClassArray = (target: any): target is FormalParameterClass[] => {
    return Array.isArray(target) && target.every((t) => isFormalParameterClass(t));
};

export const formalParameterConvert = (
    target: FormalParameterTypeClass,
    errorClass: ErrorTypeClass[],
): FormalParameterClass => {
    const formalParameter = new FormalParameterClass();

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        formalParameter.setValue(normalIdConvert(valueTypeClass));
    }

    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);
    if (valueTypeTypeClass) {
        formalParameter.setValueType(typeRefConvert(valueTypeTypeClass, errorClass));
    }

    const modifiers: NormalModifierClass[] = [];
    target.getModifier().forEach((m) => {
        const typeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (typeClass) {
            const modifier = normalModifierConvert(typeClass, errorClass);
            if (modifier) {
                modifiers.push(modifier);
            }
        }
    });
    formalParameter.setModifier(modifiers);

    return formalParameter;
};

export const formalParametersConvert = (
    target: FormalParametersTypeClass,
    errorClass: ErrorTypeClass[],
): FormalParameterClass[] => {
    const values: FormalParameterClass[] = [];

    const value = target.getValue();
    if (value) {
        const typeClass = toTypeClass(value, isFormalParameterListType, errorClass);
        if (typeClass) {
            values.push(...formalParameterListConvert(typeClass, errorClass));
        }
    }
    return values;
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
