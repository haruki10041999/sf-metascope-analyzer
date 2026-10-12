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
    AnonymousBlockMemberClass,
    anonymousBlockMemberConvert,
    TriggerBlockMemberClass,
    triggerBlockMemberConvert,
} from './member';

export const normalBlockConvert = (
    target: NormalBlockTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatementClass[] => {
    const values: NormalStatement[] = [];
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
): NormalStatement[] => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalBlockType, errorClass);
    if (valueTypeClass) {
        return normalBlockConvert(valueTypeClass, errorClass);
    }

    return [];
};

export class PropertyBlockClass extends CommonClass {
    private type: 'getter' | 'setter' | null = null;
    private value: NormalStatement[] = [];
    private modifier: NormalModifier[] = [];

    setType(type: 'getter' | 'setter' | null): void {
        this.type = type;
    }

    resetValue(): void {
        this.value = [];
    }

    setValue(value: NormalStatement[]): void {
        this.value.push(...value);
    }

    resetModifier(): void {
        this.modifier = [];
    }

    setModifier(modifier: NormalModifier[]): void {
        this.modifier.push(...modifier);
    }

    getType(): 'getter' | 'setter' | null {
        return this.type;
    }

    getValue(): NormalStatement[] {
        return this.value;
    }

    getModifier(): NormalModifier[] {
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

export const isPropertyBlockClass = (target: CommonClass): target is PropertyBlockClass => {
    return isCommonClass(target, PropertyBlockClass);
};

export const propertyBlockConvert = (
    target: PropertyBlockTypeClass,
    errorClass: ErrorTypeClass[],
): PropertyBlock => {
    const propertyBlock: PropertyBlock = {
        value: [],
        modifier: [],
    };

    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is GetterTypeClass | SetterTypeClass =>
            isGetterType(target) || isSetterType(target),
        errorClass,
    );
    if (valueTypeClass) {
        if (isGetterType(valueTypeClass)) {
            propertyBlock.type = 'getter';
            propertyBlock.value.push(...getterConvert(valueTypeClass, errorClass));
        } else if (isSetterType(valueTypeClass)) {
            propertyBlock.type = 'setter';
            propertyBlock.value.push(...setterConvert(valueTypeClass, errorClass));
        }
    }

    target.getModifier().forEach((m) => {
        const typeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (typeClass) {
            const modifier = normalModifierConvert(typeClass, errorClass);
            if (modifier) {
                propertyBlock.modifier.push(modifier);
            }
        }
    });

    return propertyBlock;
};

export const anonymousBlockConvert = (
    target: AnonymousBlockTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousBlockMember[] => {
    const values: AnonymousBlockMember[] = [];
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
): TriggerBlockMember[] => {
    const values: TriggerBlockMember[] = [];
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
): NormalStatement[] => {
    const value = target.getValue();
    if (value) {
        const valueTypeClass = toTypeClass(value, isNormalBlockType, errorClass);
        if (valueTypeClass) {
            return normalBlockConvert(valueTypeClass, errorClass);
        }
    }

    return [];
};

export const setterConvert = (
    target: SetterTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatement[] => {
    const value = target.getValue();
    if (value) {
        const valueTypeClass = toTypeClass(value, isNormalBlockType, errorClass);
        if (valueTypeClass) {
            return normalBlockConvert(valueTypeClass, errorClass);
        }
    }

    return [];
};
