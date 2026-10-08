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
    NormalStatementTypeClass,
    isNormalStatementType,
    AnonymousBlockMemberTypeClass,
    isAnonymousBlockMemberType,
    TriggerBlockMemberTypeClass,
    isTriggerBlockMemberType,
    NormalModifierTypeClass,
    isNormalModifierType,
} from '../../apex_IR';

import { toTypeClass } from './commons';

export const normalBlockConvert = (
    target: NormalBlockTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatementTypeClass[] | null => {
    const values: NormalStatementTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isNormalStatementType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
        }
    });

    return values.length > 0 ? values : null;
};

export const finallyBlockConvert = (
    target: FinallyBlockTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatementTypeClass[] | null => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalBlockType, errorClass);
    return valueTypeClass
        ? normalBlockConvert(valueTypeClass as NormalBlockTypeClass, errorClass)
        : null;
};

export const propertyBlockConvert = (
    target: PropertyBlockTypeClass,
    errorClass: ErrorTypeClass[],
): {
    type: 'getter' | 'setter' | null;
    value: NormalStatementTypeClass[] | null;
    modifier: NormalModifierTypeClass[] | null;
} => {
    let type: 'getter' | 'setter' | null = null;
    let value: NormalStatementTypeClass[] | null = null;
    const modifier: NormalModifierTypeClass[] = [];

    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is GetterTypeClass | SetterTypeClass =>
            isGetterType(target) || isSetterType(target),
        errorClass,
    );
    if (valueTypeClass) {
        if (isGetterType(valueTypeClass)) {
            type = 'getter';
            value = getterConvert(valueTypeClass, errorClass);
        } else if (isSetterType(valueTypeClass)) {
            type = 'setter';
            value = setterConvert(valueTypeClass, errorClass);
        }
    }

    target.getModifier().forEach((item) => {
        const modifierTypeClass = toTypeClass(item, isNormalModifierType, errorClass);
        if (modifierTypeClass) {
            modifier.push(modifierTypeClass);
        }
    });

    return { type: type, value: value, modifier: modifier.length > 0 ? modifier : null };
};

export const anonymousBlockConvert = (
    target: AnonymousBlockTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousBlockMemberTypeClass[] | null => {
    const values: AnonymousBlockMemberTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isAnonymousBlockMemberType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
        }
    });

    return values.length > 0 ? values : null;
};

export const triggerBlockConvert = (
    target: TriggerBlockTypeClass,
    errorClass: ErrorTypeClass[],
): TriggerBlockMemberTypeClass[] | null => {
    const values: TriggerBlockMemberTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isTriggerBlockMemberType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
        }
    });

    return values.length > 0 ? values : null;
};

export const getterConvert = (
    target: GetterTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatementTypeClass[] | null => {
    const valueTypeClass = target.getValue();
    if (valueTypeClass) {
        const blockTypeClass = toTypeClass(valueTypeClass, isNormalBlockType, errorClass);
        if (blockTypeClass) {
            return normalBlockConvert(blockTypeClass as NormalBlockTypeClass, errorClass);
        }
    }
    return null;
};

export const setterConvert = (
    target: SetterTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatementTypeClass[] | null => {
    const valueTypeClass = target.getValue();
    if (valueTypeClass) {
        const blockTypeClass = toTypeClass(valueTypeClass, isNormalBlockType, errorClass);
        if (blockTypeClass) {
            return normalBlockConvert(blockTypeClass as NormalBlockTypeClass, errorClass);
        }
    }
    return null;
};
