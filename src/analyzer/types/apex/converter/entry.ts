import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { FieldNameType } from './name';
import { SoqlFunctionType, SubQueryType } from './query';
import { TypeOfType } from './clause';
import { SoqlIdType } from './id';

export type SelectEntryType = CommonType<'selectEntry'> & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType | SubQueryType | TypeOfType>;
    alias: ValueRuleValue<SoqlIdType | null>;
};

export const isSelectEntryType = (value: unknown): value is SelectEntryType => {
    return isCommonType(value) && value.type === 'selectEntry';
};

export type SubFieldEntryType = CommonType<'subFieldEntry'> & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType | SubQueryType | TypeOfType>;
    alias: ValueRuleValue<SoqlIdType | null>;
};

export const isSubFieldEntryType = (value: unknown): value is SubFieldEntryType => {
    return isCommonType(value) && value.type === 'subFieldEntry';
};
