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

import { toPrimitiveValue, toTypeClass, CommonClass, isCommonClass } from './commons';
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

export class TriggerCaseClass extends CommonClass {
    private value: string | null;
    private triggerCaseType: string;

    constructor(value: string | null, triggerCaseType: string) {
        super();
        this.value = value;
        this.triggerCaseType = triggerCaseType;
    }

    getValue(): string | null {
        return this.value;
    }

    getContent(): string {
        return this.triggerCaseType;
    }
}

export const isTriggerCaseClass = (target: CommonClass): target is TriggerCaseClass => {
    return isCommonClass(target, TriggerCaseClass);
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

export class TriggerUnitClass extends CommonClass {
    private value: string[];
    private triggerCaseType: TriggerCase[];
    private block: TriggerBlockMember[];

    constructor(value: string[], triggerCaseType: TriggerCase[], block: TriggerBlockMember[]) {
        super();
        this.value = value;
        this.triggerCaseType = triggerCaseType;
        this.block = block;
    }

    getValue(): string[] {
        return this.value;
    }

    getContent(): TriggerCase[] {
        return this.triggerCaseType;
    }

    getBlock(): TriggerBlockMember[] {
        return this.block;
    }
}

export const isTriggerUnitClass = (target: CommonClass): target is TriggerUnitClass => {
    return isCommonClass(target, TriggerUnitClass);
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
