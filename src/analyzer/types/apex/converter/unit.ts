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
import { NormalId, normalIdConvert } from './id';
import { AnonymousBlock, anonymousBlockConvert, TriggerBlock, triggerBlockConvert } from './block';
import { TypeDeclaration, typeDeclarationConvert } from './declaration';

export type AnonymousUnit = AnonymousBlock;

export const anonymousUnitConvert = (
    target: AnonymousUnitTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousUnit => {
    const valueTypeClass = toTypeClass(target.getValue(), isAnonymousBlockType, errorClass);
    return valueTypeClass ? anonymousBlockConvert(valueTypeClass, errorClass) : undefined;
};

export type CompilationUnit = TypeDeclaration | undefined;

export const compilationUnitConvert = (
    target: CompilationUnitTypeClass,
    errorClass: ErrorTypeClass[],
): CompilationUnit => {
    const valueTypeClass = toTypeClass(target.getValue(), isTypeDeclarationType, errorClass);
    return valueTypeClass ? typeDeclarationConvert(valueTypeClass, errorClass) : undefined;
};

export type TriggerCase = {
    value: string | undefined;
    triggerCaseType: string;
};

export const triggerCaseConvert = (
    target: TriggerCaseTypeClass,
    errorClass: ErrorTypeClass[],
): TriggerCase => {
    return {
        value: toPrimitiveValue(
            target.getValue(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
        triggerCaseType: target.getTriggerCaseType(),
    };
};

export type TriggerUnit = {
    value: NormalId[] | undefined;
    triggerCase: TriggerCase[] | undefined;
    block: TriggerBlock;
};

export const triggerUnitConvert = (
    target: TriggerUnitTypeClass,
    errorClass: ErrorTypeClass[],
): TriggerUnit => {
    const value: NormalId[] = [];
    target.getValue().forEach((item) => {
        const idTypeClass = toTypeClass(item, isNormalIdType, errorClass);
        if (idTypeClass) {
            value.push(normalIdConvert(idTypeClass));
        }
    });

    const triggerCase: TriggerCase[] = [];
    target.getTriggerCase().forEach((item) => {
        const caseTypeClass = toTypeClass(item, isTriggerCaseType, errorClass);
        if (caseTypeClass) {
            triggerCase.push(triggerCaseConvert(caseTypeClass, errorClass));
        }
    });

    const blockTypeClass = toTypeClass(target.getBlock(), isTriggerBlockType, errorClass);

    return {
        value: value.length > 0 ? value : undefined,
        triggerCase: triggerCase.length > 0 ? triggerCase : undefined,
        block: blockTypeClass ? triggerBlockConvert(blockTypeClass, errorClass) : undefined,
    };
};
