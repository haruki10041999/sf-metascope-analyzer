import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { BaseExpressionType } from './expression';
import { IdType, AnyIdType } from './id';
import { TypeListType } from './list';
import { ElementValueType } from './value';

export type ElementValuePairsType = CommonType<'elementValuePairs'> & {
    value: ValueRuleValue<ElementValuePairType>[];
};

export const isElementValuePairsType = (value: unknown): value is ElementValuePairsType => {
    return isCommonType(value) && value.type === 'elementValuePairs';
};

export type ElementValuePairType = CommonType<'elementValuePair'> & {
    left: ValueRuleValue<IdType>;
    right: ValueRuleValue<ElementValueType>;
};

export const isElementValuePairType = (value: unknown): value is ElementValuePairType => {
    return isCommonType(value) && value.type === 'elementValuePair';
};

export type IdCreatedNamePairType = CommonType<'idCreatedNamePair'> & {
    left: ValueRuleValue<AnyIdType>;
    right: ValueRuleValue<TypeListType | null>;
};

export const isIdCreatedNamePairType = (value: unknown): value is IdCreatedNamePairType => {
    return isCommonType(value) && value.type === 'idCreatedNamePair';
};

export type MapCreatorRestPairType = CommonType<'mapCreatorRestPair'> & {
    left: ValueRuleValue<BaseExpressionType>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isMapCreatorRestPairType = (value: unknown): value is MapCreatorRestPairType => {
    return isCommonType(value) && value.type === 'mapCreatorRestPair';
};
