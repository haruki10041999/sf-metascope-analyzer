import typia from 'typia';

import {
    SelectEntryTypeClass,
    SubFieldEntryTypeClass,
    isSelectEntryType as isSelectEntryTypeClass,
    isSubFieldEntryType as isSubFieldEntryTypeClass,
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
} from './commons';
import { makeFieldNameRule, FieldNameType } from './name';
import { makeSoqlFunctionRule, makeSubQueryRule, SoqlFunctionType, SubQueryType } from './query';
import { makeTypeOfRule, TypeOfType } from './clause';
import { makeSoqlIdRule, SoqlIdType } from './id';

export type SelectEntryType = {
    type: string;
    value: ValueRuleValue<FieldNameType | SoqlFunctionType | SubQueryType | TypeOfType>;
    alias: ValueRuleValue<SoqlIdType>;
};

export const isSelectEntryType = typia.createIs<SelectEntryType>();

export const makeSelectEntryRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SelectEntryTypeClass, SelectEntryType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSelectEntryTypeClass),
        construct: (entryTypeClass: SelectEntryTypeClass) => {
            const node = makeSourceNode(entryTypeClass);
            const value = assignMultiClass(entryTypeClass.getValue(), [
                makeFieldNameRule(sourceField(node, 'value'), errorInfo),
                makeSoqlFunctionRule(sourceField(node, 'value'), errorInfo),
                makeSubQueryRule(sourceField(node, 'value'), errorInfo),
                makeTypeOfRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const alias = assignMultiClass(entryTypeClass.getAlias(), [
                makeSoqlIdRule(sourceField(node, 'alias'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: entryTypeClass.getType(), value, alias };
        },
    };
};

export type SubFieldEntryType = {
    type: string;
    value: ValueRuleValue<FieldNameType | SoqlFunctionType | SubQueryType | TypeOfType>;
    alias: ValueRuleValue<SoqlIdType>;
};

export const isSubFieldEntryType = typia.createIs<SubFieldEntryType>();

export const makeSubFieldEntryRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SubFieldEntryTypeClass, SubFieldEntryType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSubFieldEntryTypeClass),
        construct: (entryTypeClass: SubFieldEntryTypeClass) => {
            const node = makeSourceNode(entryTypeClass);
            const value = assignMultiClass(entryTypeClass.getValue(), [
                makeFieldNameRule(sourceField(node, 'value'), errorInfo),
                makeSoqlFunctionRule(sourceField(node, 'value'), errorInfo),
                makeSubQueryRule(sourceField(node, 'value'), errorInfo),
                makeTypeOfRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const alias = assignMultiClass(entryTypeClass.getAlias(), [
                makeSoqlIdRule(sourceField(node, 'alias'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: entryTypeClass.getType(), value, alias };
        },
    };
};

