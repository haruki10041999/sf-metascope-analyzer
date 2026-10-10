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

import { toTypeClass } from './commons';
import { NormalModifier, normalModifierConvert } from './modifier';
import { NormalStatement, normalStatementConvert } from './statement';
import {
    AnonymousBlockMember,
    anonymousBlockMemberConvert,
    TriggerBlockMember,
    triggerBlockMemberConvert,
} from './member';

export const normalBlockConvert = (
    target: NormalBlockTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatement[] => {
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

export type PropertyBlock = {
    type?: 'getter' | 'setter';
    value: NormalStatement[];
    modifier: NormalModifier[];
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
