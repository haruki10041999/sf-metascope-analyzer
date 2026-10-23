import {
    SelectEntryTypeClass,
    SubFieldEntryTypeClass,
    isSelectEntryType as isSelectEntryTypeClass,
    isSubFieldEntryType as isSubFieldEntryTypeClass,
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
    makeNullAssignRule,
    makeSourceInfo,
} from './commons';
import { makeFieldNameAssignRule, FieldNameType } from './name';
import {
    makeSoqlFunctionAssignRule,
    makeSubQueryAssignRule,
    SoqlFunctionType,
    SubQueryType,
} from './query';
import { makeTypeOfAssignRule, TypeOfType } from './clause';
import { makeSoqlIdAssignRule, SoqlIdType } from './id';

export type SelectEntryType = CommonType<'selectEntry'> & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType | SubQueryType | TypeOfType>;
    alias: ValueRuleValue<SoqlIdType | null>;
};

export const isSelectEntryType = (value: unknown): value is SelectEntryType => {
    return isCommonType(value) && value.type === 'selectEntry';
};

export const makeSelectEntryAssignRule: AssignForValueRule<SelectEntryTypeClass, SelectEntryType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isSelectEntryTypeClass),
        construct: (entryTypeClass: SelectEntryTypeClass) => {
            const value = assignMultiClass(entryTypeClass.getValue(), [
                makeFieldNameAssignRule,
                makeSoqlFunctionAssignRule,
                makeSubQueryAssignRule,
                makeTypeOfAssignRule,
                makeErrorAssignRule,
            ]);
            const alias = assignMultiClass(entryTypeClass.getAlias(), [
                makeSoqlIdAssignRule,
                makeErrorAssignRule,
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

export type SubFieldEntryType = CommonType<'subFieldEntry'> & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType | SubQueryType | TypeOfType>;
    alias: ValueRuleValue<SoqlIdType | null>;
};

export const isSubFieldEntryType = (value: unknown): value is SubFieldEntryType => {
    return isCommonType(value) && value.type === 'subFieldEntry';
};

export const makeSubFieldEntryAssignRule: AssignForValueRule<
    SubFieldEntryTypeClass,
    SubFieldEntryType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSubFieldEntryTypeClass),
    construct: (entryTypeClass: SubFieldEntryTypeClass) => {
        const value = assignMultiClass(entryTypeClass.getValue(), [
            makeFieldNameAssignRule,
            makeSoqlFunctionAssignRule,
            makeSubQueryAssignRule,
            makeTypeOfAssignRule,
            makeErrorAssignRule,
        ]);
        const alias = assignMultiClass(entryTypeClass.getAlias(), [
            makeSoqlIdAssignRule,
            makeErrorAssignRule,
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
