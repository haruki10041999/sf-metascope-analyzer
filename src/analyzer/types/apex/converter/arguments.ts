import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { ExpressionListType, TypeListType } from './list';

export type ArgumentsType = CommonType<'arguments'> & {
    value: ValueRuleValue<ExpressionListType | null>;
};

export const isArgumentsType = (value: unknown): value is ArgumentsType => {
    return isCommonType(value) && value.type === 'arguments';
};

export type TypeArgumentsType = CommonType<'typeArguments'> & {
    value: ValueRuleValue<TypeListType | null>;
};

export const isTypeArgumentsType = (value: unknown): value is TypeArgumentsType => {
    return isCommonType(value) && value.type === 'typeArguments';
};
