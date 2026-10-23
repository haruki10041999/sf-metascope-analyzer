import {
    AnonymousUnitTypeClass,
    CompilationUnitTypeClass,
    TriggerCaseTypeClass,
    TriggerUnitTypeClass,
    isAnonymousUnitType as isAnonymousUnitTypeClass,
    isCompilationUnitType as isCompilationUnitTypeClass,
    isTriggerCaseType as isTriggerCaseTypeClass,
    isTriggerUnitType as isTriggerUnitTypeClass,
} from '../../apex_IR';

import {
    isCommonType,
    ErrorType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeStringAssignRule,
    makeSourceInfo,
} from './commons';
import {
    makeAnonymousBlockAssignRule,
    makeTriggerBlockAssignRule,
    AnonymousBlockType,
    TriggerBlockType,
} from './block';
import { makeTypeDeclarationAssignRule, TypeDeclarationType } from './declaration';
import { makeIdAssignRule, IdType } from './id';

export type AnonymousUnitType = CommonType<'anonymousUnit'> & {
    value: ValueRuleValue<AnonymousBlockType>;
};

export const isAnonymousUnitType = (value: unknown): value is AnonymousUnitType => {
    return isCommonType(value) && value.type === 'anonymousUnit';
};

export const makeAnonymousUnitAssignRule: AssignForValueRule<
    AnonymousUnitTypeClass,
    AnonymousUnitType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isAnonymousUnitTypeClass),
    construct: (unitTypeClass: AnonymousUnitTypeClass) => {
        const value = assignMultiClass(unitTypeClass.getValue(), [
            makeAnonymousBlockAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: unitTypeClass.getType(),
            sourceInfo: makeSourceInfo(unitTypeClass),
            value,
        };
    },
};

export type CompilationUnitType = CommonType<'compilationUnit'> & {
    value: ValueRuleValue<TypeDeclarationType>;
};

export const isCompilationUnitType = (value: unknown): value is CompilationUnitType => {
    return isCommonType(value) && value.type === 'compilationUnit';
};

export const makeCompilationUnitAssignRule: AssignForValueRule<
    CompilationUnitTypeClass,
    CompilationUnitType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isCompilationUnitTypeClass),
    construct: (unitTypeClass: CompilationUnitTypeClass) => {
        const value = assignMultiClass(unitTypeClass.getValue(), [
            makeTypeDeclarationAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: unitTypeClass.getType(),
            sourceInfo: makeSourceInfo(unitTypeClass),
            value,
        };
    },
};

export type TriggerCaseType = CommonType<'triggerCase'> & {
    timing: ValueRuleValue<string>;
    triggerCaseType: string;
};

export const isTriggerCaseType = (value: unknown): value is TriggerCaseType => {
    return isCommonType(value) && value.type === 'triggerCase';
};

export const makeTriggerCaseAssignRule: AssignForValueRule<TriggerCaseTypeClass, TriggerCaseType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isTriggerCaseTypeClass),
        construct: (unitTypeClass: TriggerCaseTypeClass) => {
            const timing = assignMultiClass(unitTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule,
            ]);
            const triggerCaseType = unitTypeClass.getTriggerCaseType();
            return {
                type: unitTypeClass.getType(),
                sourceInfo: makeSourceInfo(unitTypeClass),
                timing,
                triggerCaseType,
            };
        },
    };

export type TriggerUnitType = CommonType<'triggerUnit'> & {
    value: ValueRuleValue<IdType>[];
    triggerCase: ValueRuleValue<TriggerCaseType>[];
    block: ValueRuleValue<TriggerBlockType>;
};

export const isTriggerUnitType = (value: unknown): value is TriggerUnitType => {
    return isCommonType(value) && value.type === 'triggerUnit';
};

export const makeTriggerUnitAssignRule: AssignForValueRule<TriggerUnitTypeClass, TriggerUnitType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isTriggerUnitTypeClass),
        construct: (unitTypeClass: TriggerUnitTypeClass) => {
            const value = unitTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeIdAssignRule, makeErrorAssignRule]));
            const triggerCase = unitTypeClass
                .getTriggerCase()
                .map((v) => assignMultiClass(v, [makeTriggerCaseAssignRule, makeErrorAssignRule]));
            const block = assignMultiClass(unitTypeClass.getBlock(), [
                makeTriggerBlockAssignRule,
                makeErrorAssignRule,
            ]);
            return {
                type: unitTypeClass.getType(),
                sourceInfo: makeSourceInfo(unitTypeClass),
                value,
                triggerCase,
                block,
            };
        },
    };
