import typia from 'typia';

import {
    SelectEntryTypeClass,
    SubFieldEntryTypeClass,
    isSelectEntryType as isSelectEntryTypeClass,
    isSubFieldEntryType as isSubFieldEntryTypeClass,
} from '../../apex_IR';

import {
    ErrorInfo,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeNullAssignRule,
    makeSourceInfo,
} from './commons';
import { makeFieldNameRule, FieldNameType } from './name';
import { makeSoqlFunctionRule, makeSubQueryRule, SoqlFunctionType, SubQueryType } from './query';
import { makeTypeOfRule, TypeOfType } from './clause';
import { makeSoqlIdRule, SoqlIdType } from './id';

export type SelectEntryType = CommonType & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType | SubQueryType | TypeOfType>;
    alias: ValueRuleValue<SoqlIdType | null>;
};

export const isSelectEntryType = typia.createIs<SelectEntryType>();

export const makeSelectEntryRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<SelectEntryTypeClass, SelectEntryType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSelectEntryTypeClass),
        construct: (entryTypeClass: SelectEntryTypeClass) => {
            const value = assignMultiClass(entryTypeClass.getValue(), [
                makeFieldNameRule(errorInfo),
                makeSoqlFunctionRule(errorInfo),
                makeSubQueryRule(errorInfo),
                makeTypeOfRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const alias = assignMultiClass(entryTypeClass.getAlias(), [
                makeSoqlIdRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: entryTypeClass.getType(),
                sourceInfo: makeSourceInfo(entryTypeClass),
                value,
                alias,
            };
        },
    };
};

export type SubFieldEntryType = CommonType & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType | SubQueryType | TypeOfType>;
    alias: ValueRuleValue<SoqlIdType | null>;
};

export const isSubFieldEntryType = typia.createIs<SubFieldEntryType>();

export const makeSubFieldEntryRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<SubFieldEntryTypeClass, SubFieldEntryType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSubFieldEntryTypeClass),
        construct: (entryTypeClass: SubFieldEntryTypeClass) => {
            const value = assignMultiClass(entryTypeClass.getValue(), [
                makeFieldNameRule(errorInfo),
                makeSoqlFunctionRule(errorInfo),
                makeSubQueryRule(errorInfo),
                makeTypeOfRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const alias = assignMultiClass(entryTypeClass.getAlias(), [
                makeSoqlIdRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: entryTypeClass.getType(),
                sourceInfo: makeSourceInfo(entryTypeClass),
                value,
                alias,
            };
        },
    };
};

