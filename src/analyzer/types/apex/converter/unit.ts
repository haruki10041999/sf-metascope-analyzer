import {
    ErrorTypeClass,
    AnonymousUnitTypeClass,
    CompilationUnitTypeClass,
    TriggerCaseTypeClass,
    TriggerUnitTypeClass,
    isAnonymousBlockType,
    isNormalIdType,
    isTriggerBlockType,
    isTriggerCaseType,
    isTypeDeclarationType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { normalIdConvert } from './id';
import { anonymousBlockConvert, triggerBlockConvert } from './block';
import { TypeDeclaration, typeDeclarationConvert } from './declaration';
import { AnonymousBlockMember, TriggerBlockMember } from './member';

export const anonymousUnitConvert = (
    target: AnonymousUnitTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousBlockMember[] => {
    const valueTypeClass = toTypeClass(target.getValue(), isAnonymousBlockType, errorClass);
    if (valueTypeClass) {
        return anonymousBlockConvert(valueTypeClass, errorClass);
    }

    return [];
};

export const compilationUnitConvert = (
    target: CompilationUnitTypeClass,
    errorClass: ErrorTypeClass[],
): TypeDeclaration | undefined => {
    const valueTypeClass = toTypeClass(target.getValue(), isTypeDeclarationType, errorClass);
    if (valueTypeClass) {
        return typeDeclarationConvert(valueTypeClass, errorClass);
    }

    return undefined;
};

export type TriggerCase = {
    value?: string;
    triggerCaseType: string;
};

export const triggerCaseConvert = (
    target: TriggerCaseTypeClass,
    errorClass: ErrorTypeClass[],
): TriggerCase => {
    const triggerCase: TriggerCase = { triggerCaseType: target.getTriggerCaseType() };

    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (value) {
        triggerCase.value = value;
    }

    return triggerCase;
};

export type TriggerUnit = {
    value: string[];
    triggerCase: TriggerCase[];
    block: TriggerBlockMember[];
};

export const triggerUnitConvert = (
    target: TriggerUnitTypeClass,
    errorClass: ErrorTypeClass[],
): TriggerUnit => {
    const triggerUnit: TriggerUnit = {
        value: [],
        triggerCase: [],
        block: [],
    };

    target.getValue().forEach((item) => {
        const idTypeClass = toTypeClass(item, isNormalIdType, errorClass);
        if (idTypeClass) {
            triggerUnit.value.push(normalIdConvert(idTypeClass));
        }
    });

    target.getTriggerCase().forEach((item) => {
        const caseTypeClass = toTypeClass(item, isTriggerCaseType, errorClass);
        if (caseTypeClass) {
            triggerUnit.triggerCase.push(triggerCaseConvert(caseTypeClass, errorClass));
        }
    });

    const blockTypeClass = toTypeClass(target.getBlock(), isTriggerBlockType, errorClass);
    if (blockTypeClass) {
        triggerUnit.block.push(...triggerBlockConvert(blockTypeClass, errorClass));
    }

    return triggerUnit;
};
