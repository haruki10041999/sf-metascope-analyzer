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
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { NormalModifier, normalModifierListConvert } from './modifier';
import { NormalStatement, normalStatementConvert } from './statement';
import {
    AnonymousBlockMember,
    anonymousBlockMemberConvert,
    TriggerBlockMember,
    triggerBlockMemberConvert,
} from './member';

export type NormalBlock = NormalStatement[] | undefined;

export const normalBlockConvert = (
    target: NormalBlockTypeClass,
    errorClass: ErrorTypeClass[],
): NormalBlock => {
    const values: NormalStatement[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isNormalStatementType, errorClass);
        if (valueTypeClass) {
            values.push(normalStatementConvert(valueTypeClass, errorClass));
        }
    });

    return values.length > 0 ? values : undefined;
};

export type FinallyBlock = NormalBlock | undefined;

export const finallyBlockConvert = (
    target: FinallyBlockTypeClass,
    errorClass: ErrorTypeClass[],
): FinallyBlock => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalBlockType, errorClass);
    return valueTypeClass ? normalBlockConvert(valueTypeClass, errorClass) : undefined;
};

export type PropertyBlock = {
    type: 'getter' | 'setter' | undefined;
    value: NormalBlock;
    modifier: NormalModifier[] | undefined;
};

export const propertyBlockConvert = (
    target: PropertyBlockTypeClass,
    errorClass: ErrorTypeClass[],
): PropertyBlock => {
    let type: 'getter' | 'setter' | undefined = undefined;
    let value: NormalBlock = undefined;

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

    return {
        type: type,
        value: value,
        modifier: normalModifierListConvert(target.getModifier(), errorClass),
    };
};

export type AnonymousBlock = AnonymousBlockMember[] | undefined;

export const anonymousBlockConvert = (
    target: AnonymousBlockTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousBlock => {
    const values: AnonymousBlockMember[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isAnonymousBlockMemberType, errorClass);
        if (valueTypeClass) {
            values.push(anonymousBlockMemberConvert(valueTypeClass, errorClass));
        }
    });

    return values.length > 0 ? values : undefined;
};

export type TriggerBlock = TriggerBlockMember[] | undefined;

export const triggerBlockConvert = (
    target: TriggerBlockTypeClass,
    errorClass: ErrorTypeClass[],
): TriggerBlock => {
    const values: TriggerBlockMember[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isTriggerBlockMemberType, errorClass);
        if (valueTypeClass) {
            values.push(triggerBlockMemberConvert(valueTypeClass, errorClass));
        }
    });

    return values.length > 0 ? values : undefined;
};

export type Getter = NormalBlock;

export const getterConvert = (target: GetterTypeClass, errorClass: ErrorTypeClass[]): Getter => {
    const valueTypeClass = target.getValue();
    const blockTypeClass = valueTypeClass
        ? toTypeClass(valueTypeClass, isNormalBlockType, errorClass)
        : undefined;
    return blockTypeClass ? normalBlockConvert(blockTypeClass, errorClass) : undefined;
};

export type Setter = NormalBlock;

export const setterConvert = (target: SetterTypeClass, errorClass: ErrorTypeClass[]): Setter => {
    const valueTypeClass = target.getValue();
    const blockTypeClass = valueTypeClass
        ? toTypeClass(valueTypeClass, isNormalBlockType, errorClass)
        : undefined;
    return blockTypeClass ? normalBlockConvert(blockTypeClass, errorClass) : undefined;
};
