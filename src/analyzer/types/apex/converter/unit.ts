import typia from 'typia';

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
    ErrorInfo,
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
    makeAnonymousBlockRule,
    makeTriggerBlockRule,
    AnonymousBlockType,
    TriggerBlockType,
} from './block';
import { makeTypeDeclarationRule, TypeDeclarationType } from './declaration';
import { makeIdRule, IdType } from './id';

export type AnonymousUnitType = CommonType & {
    value: ValueRuleValue<AnonymousBlockType>;
};

export const isAnonymousUnitType = typia.createIs<AnonymousUnitType>();

export const makeAnonymousUnitRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<AnonymousUnitTypeClass, AnonymousUnitType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAnonymousUnitTypeClass),
        construct: (unitTypeClass: AnonymousUnitTypeClass) => {
            const value = assignMultiClass(unitTypeClass.getValue(), [
                makeAnonymousBlockRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: unitTypeClass.getType(),
                sourceInfo: makeSourceInfo(unitTypeClass),
                value,
            };
        },
    };
};

export type CompilationUnitType = CommonType & {
    value: ValueRuleValue<TypeDeclarationType>;
};

export const isCompilationUnitType = typia.createIs<CompilationUnitType>();

export const makeCompilationUnitRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<CompilationUnitTypeClass, CompilationUnitType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCompilationUnitTypeClass),
        construct: (unitTypeClass: CompilationUnitTypeClass) => {
            const value = assignMultiClass(unitTypeClass.getValue(), [
                makeTypeDeclarationRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: unitTypeClass.getType(),
                sourceInfo: makeSourceInfo(unitTypeClass),
                value,
            };
        },
    };
};

export type TriggerCaseType = CommonType & {
    timing: ValueRuleValue<string>;
    triggerCaseType: string;
};

export const isTriggerCaseType = typia.createIs<TriggerCaseType>();

export const makeTriggerCaseRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<TriggerCaseTypeClass, TriggerCaseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTriggerCaseTypeClass),
        construct: (unitTypeClass: TriggerCaseTypeClass) => {
            const timing = assignMultiClass(unitTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule(errorInfo),
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
};

export type TriggerUnitType = CommonType & {
    value: ValueRuleValue<IdType>[];
    triggerCase: ValueRuleValue<TriggerCaseType>[];
    block: ValueRuleValue<TriggerBlockType>;
};

export const isTriggerUnitType = typia.createIs<TriggerUnitType>();

export const makeTriggerUnitRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<TriggerUnitTypeClass, TriggerUnitType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTriggerUnitTypeClass),
        construct: (unitTypeClass: TriggerUnitTypeClass) => {
            const value = unitTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeIdRule(), makeErrorAssignRule(errorInfo)]));
            const triggerCase = unitTypeClass
                .getTriggerCase()
                .map((v) =>
                    assignMultiClass(v, [
                        makeTriggerCaseRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            const block = assignMultiClass(unitTypeClass.getBlock(), [
                makeTriggerBlockRule(errorInfo),
                makeErrorAssignRule(errorInfo),
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
};

