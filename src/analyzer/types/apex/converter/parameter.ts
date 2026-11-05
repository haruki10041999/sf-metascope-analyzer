import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { IdType } from './id';
import { FormalParameterListType } from './list';
import { ModifierType } from './modifier';
import { TypeRefType } from './type';

export type FormalParametersType = CommonType<'formalParameters'> & {
    value: ValueRuleValue<FormalParameterListType | null>;
};

export const isFormalParametersType = (value: unknown): value is FormalParametersType => {
    return isCommonType(value) && value.type === 'formalParameters';
};

export type FormalParameterType = CommonType<'formalParameter'> & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isFormalParameterType = (value: unknown): value is FormalParameterType => {
    return isCommonType(value) && value.type === 'formalParameter';
};

export type SoqlFieldsParameterType = CommonType<'soqlFieldsParameter'> & {
    value: 'ALL' | 'CUSTOM' | 'STANDARD';
};

export const isSoqlFieldsParameterType = (value: unknown): value is SoqlFieldsParameterType => {
    return isCommonType(value) && value.type === 'soqlFieldsParameter';
};
