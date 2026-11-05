import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { BaseExpressionType } from './expression';
import { IdType } from './id';

export type ArrayInitializerType = CommonType<'arrayInitializer'> & {
    value: ValueRuleValue<BaseExpressionType>[];
};

export const isArrayInitializerType = (value: unknown): value is ArrayInitializerType => {
    return isCommonType(value) && value.type === 'arrayInitializer';
};

export type VariableDeclaratorsType = CommonType<'variableDeclarators'> & {
    value: ValueRuleValue<VariableDeclaratorType>[];
};

export const isVariableDeclaratorsType = (value: unknown): value is VariableDeclaratorsType => {
    return isCommonType(value) && value.type === 'variableDeclarators';
};

export type VariableDeclaratorType = CommonType<'variableDeclarator'> & {
    value: ValueRuleValue<IdType>;
    init: ValueRuleValue<BaseExpressionType | null>;
};

export const isVariableDeclaratorType = (value: unknown): value is VariableDeclaratorType => {
    return isCommonType(value) && value.type === 'variableDeclarator';
};
