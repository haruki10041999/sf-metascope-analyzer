import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { AnonymousBlockMemberType, TriggerBlockMemberType } from './member';
import { ModifierType } from './modifier';
import { StatementType } from './statement';

export type AnonymousBlockType = CommonType<'anonymousBlock'> & {
    value: ValueRuleValue<AnonymousBlockMemberType>[];
};

export const isAnonymousBlockType = (value: unknown): value is AnonymousBlockType => {
    return isCommonType(value) && value.type === 'anonymousBlock';
};

export type FinallyBlockType = CommonType<'finallyBlock'> & {
    block: ValueRuleValue<BlockType>;
};

export const isFinallyBlockType = (value: unknown): value is FinallyBlockType => {
    return isCommonType(value) && value.type === 'finallyBlock';
};

export type GetterType = CommonType<'getter'> & {
    block: ValueRuleValue<BlockType | null>;
};

export const isGetterType = (value: unknown): value is GetterType => {
    return isCommonType(value) && value.type === 'getter';
};

export type BlockType = CommonType<'block'> & {
    value: ValueRuleValue<StatementType>[];
};

export const isBlockType = (value: unknown): value is BlockType => {
    return isCommonType(value) && value.type === 'block';
};

export type PropertyBlockType = CommonType<'propertyBlock'> & {
    value: ValueRuleValue<SetterType | GetterType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isPropertyBlockType = (value: unknown): value is PropertyBlockType => {
    return isCommonType(value) && value.type === 'propertyBlock';
};

export type SetterType = CommonType<'setter'> & {
    block: ValueRuleValue<BlockType | null>;
};

export const isSetterType = (value: unknown): value is SetterType => {
    return isCommonType(value) && value.type === 'setter';
};

export type TriggerBlockType = CommonType<'triggerBlock'> & {
    value: ValueRuleValue<TriggerBlockMemberType>[];
};

export const isTriggerBlockType = (value: unknown): value is TriggerBlockType => {
    return isCommonType(value) && value.type === 'triggerBlock';
};
