import {
    ErrorTypeClass,
    NormalBlockTypeClass,
    FinallyBlockTypeClass,
    PropertyBlockTypeClass,
    AnonymousBlockTypeClass,
    TriggerBlockTypeClass,
    GetterTypeClass,
    SetterTypeClass,
    isNormalBlockType,
    isGetterType,
    isSetterType,
    isNormalStatementType,
    isAnonymousBlockMemberType,
    isTriggerBlockMemberType,
    isNormalModifierType,
} from '../../apex_IR';

import { toTypeClass, CommonClass, isCommonClass } from './commons';
import { NormalModifierClass, normalModifierConvert } from './modifier';
import { NormalStatementClass, normalStatementConvert } from './statement';
import {
    AnonymousTriggerBlockMemberClass,
    anonymousBlockMemberConvert,
    triggerBlockMemberConvert,
} from './member';

export const normalBlockConvert = (
    target: NormalBlockTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatementClass[] => {
    const values: NormalStatementClass[] = [];

    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isNormalStatementType, errorClass);
        if (valueTypeClass) {
            const statement = normalStatementConvert(valueTypeClass, errorClass);
            if (statement) {
                values.push(statement);
            }
        }
    });

    return values;
};

export const finallyBlockConvert = (
    target: FinallyBlockTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatementClass[] => {
    const values: NormalStatementClass[] = [];

    const valueTypeClass = toTypeClass(target.getValue(), isNormalBlockType, errorClass);
    if (valueTypeClass) {
        values.push(...normalBlockConvert(valueTypeClass, errorClass));
    }

    return values;
};

export class PropertyBlockClass extends CommonClass {
    private type: 'getter' | 'setter' | null = null;
    private value: NormalStatementClass[] = [];
    private modifier: NormalModifierClass[] = [];

    setType(type: 'getter' | 'setter' | null): void {
        this.type = type;
    }

    resetValue(): void {
        this.value = [];
    }

    setValue(value: NormalStatementClass[]): void {
        this.value.push(...value);
    }

    resetModifier(): void {
        this.modifier = [];
    }

    setModifier(modifier: NormalModifierClass[]): void {
        this.modifier.push(...modifier);
    }

    getType(): 'getter' | 'setter' | null {
        return this.type;
    }

    getValue(): NormalStatementClass[] {
        return this.value;
    }

    getModifier(): NormalModifierClass[] {
        return this.modifier;
    }

    copy(commonClass: PropertyBlockClass): void {
        this.setType(commonClass.getType());
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.resetModifier();
        this.setModifier(commonClass.getModifier());
    }
}

export const isPropertyBlockClass = (target: any): target is PropertyBlockClass => {
    return isCommonClass(target, PropertyBlockClass);
};

export const isPropertyBlockClassArray = (target: any): target is PropertyBlockClass[] => {
    return Array.isArray(target) && target.every((t) => isPropertyBlockClass(t));
};

export const propertyBlockConvert = (
    target: PropertyBlockTypeClass,
    errorClass: ErrorTypeClass[],
): PropertyBlockClass => {
    const propertyBlock = new PropertyBlockClass();

    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is GetterTypeClass | SetterTypeClass =>
            isGetterType(target) || isSetterType(target),
        errorClass,
    );
    if (valueTypeClass) {
        if (isGetterType(valueTypeClass)) {
            propertyBlock.setType('getter');
            propertyBlock.setValue(getterConvert(valueTypeClass, errorClass));
        }
        if (isSetterType(valueTypeClass)) {
            propertyBlock.setType('setter');
            propertyBlock.setValue(setterConvert(valueTypeClass, errorClass));
        }
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
    propertyBlock.setModifier(modifiers);

    return propertyBlock;
};

export const anonymousBlockConvert = (
    target: AnonymousBlockTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousTriggerBlockMemberClass[] => {
    const values: AnonymousTriggerBlockMemberClass[] = [];

    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isAnonymousBlockMemberType, errorClass);
        if (valueTypeClass) {
            values.push(anonymousBlockMemberConvert(valueTypeClass, errorClass));
        }
    });

    return values;
};

export const triggerBlockConvert = (
    target: TriggerBlockTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousTriggerBlockMemberClass[] => {
    const values: AnonymousTriggerBlockMemberClass[] = [];

    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isTriggerBlockMemberType, errorClass);
        if (valueTypeClass) {
            values.push(triggerBlockMemberConvert(valueTypeClass, errorClass));
        }
    });

    return values;
};

export const getterConvert = (
    target: GetterTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatementClass[] => {
    const values: NormalStatementClass[] = [];

    const value = target.getValue();
    if (value) {
        const valueTypeClass = toTypeClass(value, isNormalBlockType, errorClass);
        if (valueTypeClass) {
            values.push(...normalBlockConvert(valueTypeClass, errorClass));
        }
    }

    return values;
};

export const setterConvert = (
    target: SetterTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatementClass[] => {
    const values: NormalStatementClass[] = [];

    const value = target.getValue();
    if (value) {
        const valueTypeClass = toTypeClass(value, isNormalBlockType, errorClass);
        if (valueTypeClass) {
            values.push(...normalBlockConvert(valueTypeClass, errorClass));
        }
    }

    return values;
};
