import {
    ErrorTypeClass,
    AnonymousBlockMemberTypeClass,
    AnonymousMemberDeclarationTypeClass,
    NormalStatementTypeClass,
    TriggerBlockMemberTypeClass,
    TriggerMemberDeclarationTypeClass,
    isAnonymousMemberDeclarationType,
    isNormalStatementType,
    isTriggerMemberDeclarationType,
    isNormalModifierType,
} from '../../apex_IR';

import { toTypeClass, CommonClass, isCommonClass } from './commons';
import { NormalModifierClass, normalModifierConvert } from './modifier';
import { isNormalStatementClass, NormalStatementClass, normalStatementConvert } from './statement';
import {
    AnonymousTriggerMemberDeclarationClass,
    anonymousMemberDeclarationConvert,
    isAnonymousTriggerMemberDeclarationClass,
    triggerMemberDeclarationConvert,
} from './declaration';

export class AnonymousTriggerBlockMemberClass extends CommonClass {
    private value: AnonymousTriggerMemberDeclarationClass | NormalStatementClass | null = null;
    private modifier: NormalModifierClass[] = [];

    setValue(value: AnonymousTriggerMemberDeclarationClass | NormalStatementClass | null): void {
        if (
            isAnonymousTriggerMemberDeclarationClass(this.value) &&
            isAnonymousTriggerMemberDeclarationClass(value)
        ) {
            this.value.copy(value);
        } else if (isNormalStatementClass(this.value) && isNormalStatementClass(value)) {
            this.value.copy(value);
        } else {
            this.value = value;
        }
    }

    resetModifier(): void {
        this.modifier = [];
    }

    setModifier(modifier: NormalModifierClass[]): void {
        this.modifier.push(...modifier);
    }

    getValue(): AnonymousTriggerMemberDeclarationClass | NormalStatementClass | null {
        return this.value;
    }

    getModifier(): NormalModifierClass[] {
        return this.modifier;
    }

    copy(commonClass: AnonymousTriggerBlockMemberClass): void {
        this.setValue(commonClass.getValue());
        this.resetModifier();
        this.setModifier(commonClass.getModifier());
    }
}

export const isAnonymousTriggerBlockMemberClass = (
    target: any,
): target is AnonymousTriggerBlockMemberClass => {
    return isCommonClass(target, AnonymousTriggerBlockMemberClass);
};

export const isAnonymousBlockMemberClassArray = (
    target: any,
): target is AnonymousTriggerBlockMemberClass[] => {
    return Array.isArray(target) && target.every((t) => isAnonymousTriggerBlockMemberClass(t));
};

export const anonymousBlockMemberConvert = (
    target: AnonymousBlockMemberTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousTriggerBlockMemberClass => {
    const anonymousBlockMember = new AnonymousTriggerBlockMemberClass();

    const modifiers: NormalModifierClass[] = [];
    target.getModifier().forEach((m) => {
        const modifierTypeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (modifierTypeClass) {
            const modifier = normalModifierConvert(modifierTypeClass, errorClass);
            if (modifier) {
                modifiers.push(modifier);
            }
        }
    });
    anonymousBlockMember.setModifier(modifiers);

    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is AnonymousMemberDeclarationTypeClass | NormalStatementTypeClass =>
            isAnonymousMemberDeclarationType(target) || isNormalStatementType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isAnonymousMemberDeclarationType(valueTypeClass)) {
            anonymousBlockMember.setValue(
                anonymousMemberDeclarationConvert(valueTypeClass, errorClass),
            );
        }
        if (isNormalStatementType(valueTypeClass)) {
            anonymousBlockMember.setValue(normalStatementConvert(valueTypeClass, errorClass));
        }
    }

    return anonymousBlockMember;
};

export const triggerBlockMemberConvert = (
    target: TriggerBlockMemberTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousTriggerBlockMemberClass => {
    const triggerBlockMember = new AnonymousTriggerBlockMemberClass();

    const modifiers: NormalModifierClass[] = [];
    target.getModifier().forEach((m) => {
        const modifierTypeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (modifierTypeClass) {
            const modifier = normalModifierConvert(modifierTypeClass, errorClass);
            if (modifier) {
                modifiers.push(modifier);
            }
        }
    });
    triggerBlockMember.setModifier(modifiers);

    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is AnonymousMemberDeclarationTypeClass | NormalStatementTypeClass =>
            isAnonymousMemberDeclarationType(target) || isNormalStatementType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isAnonymousMemberDeclarationType(valueTypeClass)) {
            triggerBlockMember.setValue(
                anonymousMemberDeclarationConvert(valueTypeClass, errorClass),
            );
        }
        if (isNormalStatementType(valueTypeClass)) {
            triggerBlockMember.setValue(normalStatementConvert(valueTypeClass, errorClass));
        }
    }

    return triggerBlockMember;
};
