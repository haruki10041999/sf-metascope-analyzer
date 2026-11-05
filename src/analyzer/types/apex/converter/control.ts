import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { BaseExpressionType } from './expression';
import { IdType } from './id';
import { TypeRefType } from './type';
import { LocalVariableDeclarationType } from './declaration';
import { ExpressionListType } from './list';
import { WhenValueType } from './value';
import { BlockType } from './block';

export type EnhancedForControlType = CommonType<'enhancedForControl'> & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    fromVariant: ValueRuleValue<BaseExpressionType>;
};

export const isEnhancedForControlType = (value: unknown): value is EnhancedForControlType => {
    return isCommonType(value) && value.type === 'enhancedForControl';
};

export type ForControlType = CommonType<'forControl'> & {
    value: ValueRuleValue<EnhancedForControlType | BaseExpressionType | null>;
    init: ValueRuleValue<ForInitType | null>;
    update: ValueRuleValue<ForUpdateType | null>;
};

export const isForControlType = (value: unknown): value is ForControlType => {
    return isCommonType(value) && value.type === 'forControl';
};

export type ForInitType = CommonType<'forInit'> & {
    value: ValueRuleValue<LocalVariableDeclarationType | ExpressionListType>;
};

export const isForInitType = (value: unknown): value is ForInitType => {
    return isCommonType(value) && value.type === 'forInit';
};

export type ForUpdateType = CommonType<'forUpdate'> & {
    value: ValueRuleValue<ExpressionListType>;
};

export const isForUpdateType = (value: unknown): value is ForUpdateType => {
    return isCommonType(value) && value.type === 'forUpdate';
};

export type WhenControlType = CommonType<'whenControl'> & {
    value: ValueRuleValue<WhenValueType>;
    block: ValueRuleValue<BlockType>;
};

export const isWhenControlType = (value: unknown): value is WhenControlType => {
    return isCommonType(value) && value.type === 'whenControl';
};
