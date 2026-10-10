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

import { toTypeClass } from './commons';
import { NormalModifier, normalModifierConvert } from './modifier';
import { NormalStatement, normalStatementConvert } from './statement';
import {
    AnonymousMemberDeclaration,
    anonymousMemberDeclarationConvert,
    TriggerMemberDeclaration,
    triggerMemberDeclarationConvert,
} from './declaration';

export type AnonymousBlockMember = {
    value?: AnonymousMemberDeclaration | NormalStatement;
    modifier: NormalModifier[];
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

export type TriggerBlockMember = {
    value?: TriggerMemberDeclaration | NormalStatement;
    modifier: NormalModifier[];
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
