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
import { NormalStatementClass, normalStatementConvert } from './statement';
import {
    AnonymousTriggerMemberDeclarationClass,
    anonymousMemberDeclarationConvert,
    triggerMemberDeclarationConvert,
} from './declaration';

export class AnonymousBlockMemberClass extends CommonClass {
    private value: AnonymousMemberDeclaration | NormalStatement | null = null;
    private modifier: NormalModifier[] = [];

    setValue(value: AnonymousMemberDeclaration | NormalStatement | null): void {
        this.value = value;
    }

    resetModifier(): void {
        this.modifier = [];
    }

    setModifier(modifier: NormalModifier[]): void {
        this.modifier.push(...modifier);
    }

    getValue(): AnonymousMemberDeclaration | NormalStatement | null {
        return this.value;
    }

    getModifier(): NormalModifier[] {
        return this.modifier;
    }

    copy(commonClass: AnonymousBlockMemberClass): void {
        this.setValue(commonClass.getValue());
        this.resetModifier();
        this.setModifier(commonClass.getModifier());
    }
}

export const isAnonymousBlockMemberClass = (
    target: CommonClass,
): target is AnonymousBlockMemberClass => {
    return target instanceof AnonymousBlockMemberClass;
};

export const anonymousBlockMemberConvert = (
    target: AnonymousBlockMemberTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousBlockMember => {
    const modifiers: NormalModifier[] = [];
    target.getModifier().forEach((m) => {
        const modifierTypeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (modifierTypeClass) {
            const modifier = normalModifierConvert(modifierTypeClass, errorClass);
            if (modifier) {
                modifiers.push(modifier);
            }
        }
    });

    const anonymousBlockMember: AnonymousBlockMember = {
        modifier: modifiers,
    };

    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is AnonymousMemberDeclarationTypeClass | NormalStatementTypeClass =>
            isAnonymousMemberDeclarationType(target) || isNormalStatementType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isAnonymousMemberDeclarationType(valueTypeClass)) {
            const anonymousMemberDeclaration = anonymousMemberDeclarationConvert(
                valueTypeClass,
                errorClass,
            );
            if (anonymousMemberDeclaration) {
                anonymousBlockMember.value = anonymousMemberDeclaration;
            }
        }
        if (isNormalStatementType(valueTypeClass)) {
            const statement = normalStatementConvert(valueTypeClass, errorClass);
            if (statement) {
                anonymousBlockMember.value = statement;
            }
        }
    }

    return anonymousBlockMember;
};

export class TriggerBlockMemberClass extends CommonClass {
    private value: TriggerMemberDeclaration | NormalStatement | null = null;
    private modifier: NormalModifier[] = [];

    setValue(value: TriggerMemberDeclaration | NormalStatement | null): void {
        this.value = value;
    }

    resetModifier(): void {
        this.modifier = [];
    }

    setModifier(modifier: NormalModifier[]): void {
        this.modifier.push(...modifier);
    }

    getValue(): AnonymousMemberDeclaration | NormalStatement | null {
        return this.value;
    }

    getModifier(): NormalModifier[] {
        return this.modifier;
    }

    copy(commonClass: AnonymousBlockMemberClass): void {
        this.setValue(commonClass.getValue());
        this.resetModifier();
        this.setModifier(commonClass.getModifier());
    }
}

export const isTriggerBlockMemberClass = (
    target: CommonClass,
): target is TriggerBlockMemberClass => {
    return target instanceof TriggerBlockMemberClass;
};

export const triggerBlockMemberConvert = (
    target: TriggerBlockMemberTypeClass,
    errorClass: ErrorTypeClass[],
): TriggerBlockMember => {
    const modifiers: NormalModifier[] = [];
    target.getModifier().forEach((m) => {
        const modifierTypeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (modifierTypeClass) {
            const modifier = normalModifierConvert(modifierTypeClass, errorClass);
            if (modifier) {
                modifiers.push(modifier);
            }
        }
    });

    const triggerBlockMember: TriggerBlockMember = {
        modifier: modifiers,
    };

    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is TriggerMemberDeclarationTypeClass | NormalStatementTypeClass =>
            isTriggerMemberDeclarationType(target) || isNormalStatementType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isTriggerMemberDeclarationType(valueTypeClass)) {
            const triggerMemberDeclaration = triggerMemberDeclarationConvert(
                valueTypeClass,
                errorClass,
            );
            if (triggerMemberDeclaration) {
                triggerBlockMember.value = triggerMemberDeclaration;
            }
        }
        if (isNormalStatementType(valueTypeClass)) {
            const statement = normalStatementConvert(valueTypeClass, errorClass);
            if (statement) {
                triggerBlockMember.value = statement;
            }
        }
    }

    return triggerBlockMember;
};
