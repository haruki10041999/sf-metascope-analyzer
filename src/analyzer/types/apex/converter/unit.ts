import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { AnonymousBlockType, TriggerBlockType } from './block';
import { TypeDeclarationType } from './declaration';
import { IdType } from './id';

export type AnonymousUnitType = CommonType<'anonymousUnit'> & {
    value: ValueRuleValue<AnonymousBlockType>;
};

export const isAnonymousUnitType = (value: unknown): value is AnonymousUnitType => {
    return isCommonType(value) && value.type === 'anonymousUnit';
};

export type CompilationUnitType = CommonType<'compilationUnit'> & {
    value: ValueRuleValue<TypeDeclarationType>;
};

export const isCompilationUnitType = (value: unknown): value is CompilationUnitType => {
    return isCommonType(value) && value.type === 'compilationUnit';
};

export type TriggerCaseType = CommonType<'triggerCase'> & {
    timing: 'BEFORE' | 'AFTER';
    triggerCaseType: 'INSERT' | 'UPDATE' | 'DELETE' | 'UNDELETE';
};

export const isTriggerCaseType = (value: unknown): value is TriggerCaseType => {
    return isCommonType(value) && value.type === 'triggerCase';
};

export type TriggerUnitType = CommonType<'triggerUnit'> & {
    value: ValueRuleValue<IdType>[];
    triggerCase: ValueRuleValue<TriggerCaseType>[];
    block: ValueRuleValue<TriggerBlockType>;
};

export const isTriggerUnitType = (value: unknown): value is TriggerUnitType => {
    return isCommonType(value) && value.type === 'triggerUnit';
};
