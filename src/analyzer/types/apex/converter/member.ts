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
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { NormalModifier, normalModifierListConvert } from './modifier';
import { NormalStatement, normalStatementConvert } from './statement';
import {
    AnonymousMemberDeclaration,
    anonymousMemberDeclarationConvert,
    TriggerMemberDeclaration,
    triggerMemberDeclarationConvert,
} from './declaration';

export type AnonymousBlockMember = {
    value: AnonymousMemberDeclaration | NormalStatement;
    modifier: NormalModifier[] | undefined;
};

export const anonymousBlockMemberConvert = (
    target: AnonymousBlockMemberTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousBlockMember => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is AnonymousMemberDeclarationTypeClass | NormalStatementTypeClass =>
            isAnonymousMemberDeclarationType(target) || isNormalStatementType(target),
        errorClass,
    );

    let value: AnonymousBlockMember['value'] = undefined;
    if (valueTypeClass) {
        if (isAnonymousMemberDeclarationType(valueTypeClass)) {
            value = anonymousMemberDeclarationConvert(valueTypeClass, errorClass);
        }
        if (isNormalStatementType(valueTypeClass)) {
            value = normalStatementConvert(valueTypeClass, errorClass);
        }
    }

    return {
        value: value,
        modifier: normalModifierListConvert(target.getModifier(), errorClass),
    };
};

export type TriggerBlockMember = {
    value: TriggerMemberDeclaration | NormalStatement;
    modifier: NormalModifier[] | undefined;
};

export const triggerBlockMemberConvert = (
    target: TriggerBlockMemberTypeClass,
    errorClass: ErrorTypeClass[],
): TriggerBlockMember => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is TriggerMemberDeclarationTypeClass | NormalStatementTypeClass =>
            isTriggerMemberDeclarationType(target) || isNormalStatementType(target),
        errorClass,
    );

    let value: TriggerBlockMember['value'] = undefined;
    if (valueTypeClass) {
        if (isTriggerMemberDeclarationType(valueTypeClass)) {
            value = triggerMemberDeclarationConvert(valueTypeClass, errorClass);
        }
        if (isNormalStatementType(valueTypeClass)) {
            value = normalStatementConvert(valueTypeClass, errorClass);
        }
    }

    return {
        value: value,
        modifier: normalModifierListConvert(target.getModifier(), errorClass),
    };
};
