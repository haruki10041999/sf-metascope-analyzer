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
import { TypeDeclarationClass, typeDeclarationConvert } from './declaration';
import { AnonymousBlockMemberClass, TriggerBlockMemberClass } from './member';

export const anonymousUnitConvert = (
    target: AnonymousUnitTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousBlockMemberClass[] => {
    const value: AnonymousBlockMemberClass[] = [];

    const valueTypeClass = toTypeClass(target.getValue(), isAnonymousBlockType, errorClass);
    if (valueTypeClass) {
        value.push(...anonymousBlockConvert(valueTypeClass, errorClass));
    }

    return value;
};

export const compilationUnitConvert = (
    target: CompilationUnitTypeClass,
    errorClass: ErrorTypeClass[],
): TypeDeclarationClass => {
    const compilatinonUnit = new TypeDeclarationClass();

    const valueTypeClass = toTypeClass(target.getValue(), isTypeDeclarationType, errorClass);
    if (valueTypeClass) {
        compilatinonUnit.copy(typeDeclarationConvert(valueTypeClass, errorClass));
    }

    return compilatinonUnit;
};

export class TriggerCaseClass extends CommonClass {
    private value: string | null = null;
    private triggerCaseType: string | null = null;

    setValue(value: string | null): void {
        this.value = value;
    }

    setTriggerCaseType(triggerCaseType: string | null): void {
        this.triggerCaseType = triggerCaseType;
    }

    getValue(): string | null {
        return this.value;
    }

    getTriggerCaseType(): string | null {
        return this.triggerCaseType;
    }

    copy(commonClass: TriggerCaseClass): void {
        this.setValue(commonClass.getValue());
        this.setTriggerCaseType(commonClass.getTriggerCaseType());
    }
}

export const isTriggerCaseClass = (target: CommonClass): target is TriggerCaseClass => {
    return isCommonClass(target, TriggerCaseClass);
};

export const triggerCaseConvert = (
    target: TriggerCaseTypeClass,
    errorClass: ErrorTypeClass[],
): TriggerCaseClass => {
    const triggerCase = new TriggerCaseClass();
    triggerCase.setTriggerCaseType(target.getTriggerCaseType());

    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (value) {
        triggerCase.setValue(value);
    }

    return triggerCase;
};

export class TriggerUnitClass extends CommonClass {
    private value: string | null = null;
    private triggerCaseType: TriggerCaseClass[] = [];
    private block: TriggerBlockMemberClass[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    resetTriggerCaseType(): void {
        this.triggerCaseType = [];
    }

    setTriggerCaseType(triggerCaseType: TriggerCaseClass[]): void {
        this.triggerCaseType.push(...triggerCaseType);
    }

    resetBlock(): void {
        this.block = [];
    }

    setBlock(block: TriggerBlockMemberClass[]): void {
        this.block.push(...block);
    }

    getValue(): string | null {
        return this.value;
    }

    getTriggerCaseType(): TriggerCaseClass[] {
        return this.triggerCaseType;
    }

    getBlock(): TriggerBlockMemberClass[] {
        return this.block;
    }

    copy(commonClass: TriggerUnitClass): void {
        this.setValue(commonClass.getValue());
        this.resetTriggerCaseType();
        this.setTriggerCaseType(commonClass.getTriggerCaseType());
        this.resetBlock();
        this.setBlock(commonClass.getBlock());
    }
}

export const isTriggerUnitClass = (target: CommonClass): target is TriggerUnitClass => {
    return isCommonClass(target, TriggerUnitClass);
};

export const triggerUnitConvert = (
    target: TriggerUnitTypeClass,
    errorClass: ErrorTypeClass[],
): TriggerUnitClass => {
    const triggerUnit = new TriggerUnitClass();

    target.getValue().forEach((item) => {
        const idTypeClass = toTypeClass(item, isNormalIdType, errorClass);
        if (idTypeClass) {
            triggerUnit.setValue(normalIdConvert(idTypeClass));
        }
    });

    const triggerCases: TriggerCaseClass[] = [];
    target.getTriggerCase().forEach((item) => {
        const caseTypeClass = toTypeClass(item, isTriggerCaseType, errorClass);
        if (caseTypeClass) {
            triggerCases.push(triggerCaseConvert(caseTypeClass, errorClass));
        }
    });
    triggerUnit.setTriggerCaseType(triggerCases);

    const blockTypeClass = toTypeClass(target.getBlock(), isTriggerBlockType, errorClass);
    if (blockTypeClass) {
        triggerUnit.setBlock(triggerBlockConvert(blockTypeClass, errorClass));
    }

    return triggerUnit;
};
