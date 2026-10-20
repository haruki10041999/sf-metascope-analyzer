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
    SourceSlot,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceNode,
    sourceField,
    sourceList,
} from './commons';
import {
    makeAnonymousBlockRule,
    makeTriggerBlockRule,
    AnonymousBlockType,
    TriggerBlockType,
} from './block';
import { makeTypeDeclarationRule, TypeDeclarationType } from './declaration';
import { makeIdRule, IdType } from './id';

export type AnonymousUnitType = {
    type: string;
    value: ValueRuleValue<AnonymousBlockType>;
};

export const isAnonymousUnitType = typia.createIs<AnonymousUnitType>();

export const makeAnonymousUnitRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<AnonymousUnitTypeClass, AnonymousUnitType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAnonymousUnitTypeClass),
        construct: (unitTypeClass: AnonymousUnitTypeClass) => {
            const node = makeSourceNode(unitTypeClass);
            const value = assignMultiClass(unitTypeClass.getValue(), [
                makeAnonymousBlockRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: unitTypeClass.getType(), value };
        },
    };
};

export type CompilationUnitType = {
    type: string;
    value: ValueRuleValue<TypeDeclarationType>;
};

export const isCompilationUnitType = typia.createIs<CompilationUnitType>();

export const makeCompilationUnitRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CompilationUnitTypeClass, CompilationUnitType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCompilationUnitTypeClass),
        construct: (unitTypeClass: CompilationUnitTypeClass) => {
            const node = makeSourceNode(unitTypeClass);
            const value = assignMultiClass(unitTypeClass.getValue(), [
                makeTypeDeclarationRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: unitTypeClass.getType(), value };
        },
    };
};

export type TriggerCaseType = {
    type: string;
    timing: ValueRuleValue<string>;
    triggerCaseType: string;
};

export const isTriggerCaseType = typia.createIs<TriggerCaseType>();

export const makeTriggerCaseRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TriggerCaseTypeClass, TriggerCaseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTriggerCaseTypeClass),
        construct: (unitTypeClass: TriggerCaseTypeClass) => {
            const timing = assignMultiClass(unitTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            const triggerCaseType = unitTypeClass.getTriggerCaseType();
            slot(makeSourceNode(unitTypeClass));
            return { type: unitTypeClass.getType(), timing, triggerCaseType };
        },
    };
};

export type TriggerUnitType = {
    type: string;
    value: ValueRuleValue<IdType>[];
    triggerCase: ValueRuleValue<TriggerCaseType>[];
    block: ValueRuleValue<TriggerBlockType>;
};

export const isTriggerUnitType = typia.createIs<TriggerUnitType>();

export const makeTriggerUnitRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TriggerUnitTypeClass, TriggerUnitType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTriggerUnitTypeClass),
        construct: (unitTypeClass: TriggerUnitTypeClass) => {
            const node = makeSourceNode(unitTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = unitTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeIdRule(valueSource(index)),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            const triggerCaseSource = sourceList(node, 'triggerCase');
            const triggerCase = unitTypeClass
                .getTriggerCase()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeTriggerCaseRule(triggerCaseSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            const block = assignMultiClass(unitTypeClass.getBlock(), [
                makeTriggerBlockRule(sourceField(node, 'block'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: unitTypeClass.getType(), value, triggerCase, block };
        },
    };
};

