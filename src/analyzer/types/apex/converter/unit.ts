import {
    AnonymousUnitTypeClass,
    CompilationUnitTypeClass,
    TriggerCaseTypeClass,
    TriggerUnitTypeClass,
    UnitListTypeClass,
    UnitTypeClass,
    isAnonymousUnitType,
    isCompilationUnitType,
    isTriggerCaseType,
    isTriggerUnitType,
} from '../../apex_IR';
import { makeAnonymousBlockRule, makeBlockRule } from './block';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    makeEmptySourceInfoMap,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
} from './commons';
import { makeTypeDeclarationRule } from './declaration';
import { makeIdRule } from './id';

export const makeAnonymousUnitRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<AnonymousUnitTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAnonymousUnitType),
        construct: (unitTypeClass: AnonymousUnitTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const unit = assignMultiClass(unitTypeClass.getValue(), [
                makeAnonymousBlockRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[unitTypeClass.getType()] = nestedSourceInfo;
            return unit;
        },
    };
};

export const makeCompilationUnitRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CompilationUnitTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCompilationUnitType),
        construct: (unitTypeClass: CompilationUnitTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const unit = assignMultiClass(unitTypeClass.getValue(), [
                makeTypeDeclarationRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[unitTypeClass.getType()] = nestedSourceInfo;
            return unit;
        },
    };
};

export const makeTriggerCaseRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TriggerCaseTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTriggerCaseType),
        construct: (unitTypeClass: TriggerCaseTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const timing = assignMultiClass(unitTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        nestedSourceInfo['string_1'] = value;
                        return value;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
            const triggerType = unitTypeClass.getTriggerCaseType();
            nestedSourceInfo['string_2'] = triggerType;
            sourceInfo[unitTypeClass.getType()] = nestedSourceInfo;
            return { triggerType, timing };
        },
    };
};

export const makeTriggerUnitRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TriggerUnitTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTriggerUnitType),
        construct: (unitTypeClass: TriggerUnitTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const name = assignMultiClass(unitTypeClass.getValue(), [
                makeIdRule(nestedSourceInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const triggerCase = unitTypeClass.getTriggerCase().map((v, index) => {
                const valueSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    makeTriggerCaseRule(valueSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                nestedSourceInfo[`${unitTypeClass.getType()}_${index}`] = valueSourceInfo;
                return value;
            });
            const block = assignMultiClass(unitTypeClass.getBlock(), [
                makeBlockRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[unitTypeClass.getType()] = nestedSourceInfo;
            return { name, triggerCase, block };
        },
    };
};
