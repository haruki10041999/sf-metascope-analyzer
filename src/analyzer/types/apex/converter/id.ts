import { isCommonType, CommonType, ValueRuleValue } from './commons';

export type AnyIdType = CommonType<'anyId'> & {
    value: string;
};

export const isAnyIdType = (value: unknown): value is AnyIdType => {
    return isCommonType(value) && value.type === 'anyId';
};

export type IdType = CommonType<'id'> & {
    value: string;
};

export const isIdType = (value: unknown): value is IdType => {
    return isCommonType(value) && value.type === 'id';
};

export type SoqlIdType = CommonType<'soqlId'> & {
    value: ValueRuleValue<IdType>;
};

export const isSoqlIdType = (value: unknown): value is SoqlIdType => {
    return isCommonType(value) && value.type === 'soqlId';
};

export type SoslIdType = CommonType<'soslId'> & {
    value: ValueRuleValue<IdType>[];
};

export const isSoslIdType = (value: unknown): value is SoslIdType => {
    return isCommonType(value) && value.type === 'soslId';
};
