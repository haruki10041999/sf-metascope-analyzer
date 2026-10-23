import {
    EnhancedForControlTypeClass,
    ForControlTypeClass,
    ForInitTypeClass,
    ForUpdateTypeClass,
    WhenControlTypeClass,
    isEnhancedForControlType as isEnhancedForControlTypeClass,
    isForControlType as isForControlTypeClass,
    isForInitType as isForInitTypeClass,
    isForUpdateType as isForUpdateTypeClass,
    isWhenControlType as isWhenControlTypeClass,
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
import { makeBaseExpressionAssignRules, BaseExpressionType } from './expression';
import { makeIdAssignRule, IdType } from './id';
import { makeTypeRefAssignRule, TypeRefType } from './type';
import {
    makeLocalVariableDeclarationAssignRule,
    LocalVariableDeclarationType,
} from './declaration';
import { makeExpressionListAssignRule, ExpressionListType } from './list';
import { makeWhenValueAssignRule, WhenValueType } from './value';
import { makeBlockAssignRule, BlockType } from './block';

export type EnhancedForControlType = CommonType<'enhancedForControl'> & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    fromVariant: ValueRuleValue<BaseExpressionType>;
};

export const isEnhancedForControlType = (value: unknown): value is EnhancedForControlType => {
    return isCommonType(value) && value.type === 'enhancedForControl';
};

export const makeEnhancedForControlAssignRule: AssignForValueRule<
    EnhancedForControlTypeClass,
    EnhancedForControlType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isEnhancedForControlTypeClass),
    construct: (controlTypeClass: EnhancedForControlTypeClass) => {
        const value = assignMultiClass(controlTypeClass.getValue(), [
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);
        const valueType = assignMultiClass(controlTypeClass.getValueType(), [
            makeTypeRefAssignRule,
            makeErrorAssignRule,
        ]);

        const fromVariant = assignMultiClass(controlTypeClass.getFromVariant(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);

        return {
            type: controlTypeClass.getType(),
            sourceInfo: makeSourceInfo(controlTypeClass),
            value,
            valueType,
            fromVariant,
        };
    },
};

export type ForControlType = CommonType<'forControl'> & {
    value: ValueRuleValue<EnhancedForControlType | BaseExpressionType | null>;
    init: ValueRuleValue<ForInitType | null>;
    update: ValueRuleValue<ForUpdateType | null>;
};

export const isForControlType = (value: unknown): value is ForControlType => {
    return isCommonType(value) && value.type === 'forControl';
};

export const makeForControlAssignRule: AssignForValueRule<ForControlTypeClass, ForControlType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isForControlTypeClass),
    construct: (controlTypeClass: ForControlTypeClass) => {
        const value = assignMultiClass(controlTypeClass.getValue(), [
            makeEnhancedForControlAssignRule,
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);

        const init = assignMultiClass(controlTypeClass.getInit(), [
            makeForInitAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const update = assignMultiClass(controlTypeClass.getUpdate(), [
            makeForUpdateAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);

        return {
            type: controlTypeClass.getType(),
            sourceInfo: makeSourceInfo(controlTypeClass),
            value,
            init,
            update,
        };
    },
};

export type ForInitType = CommonType<'forInit'> & {
    value: ValueRuleValue<LocalVariableDeclarationType | ExpressionListType>;
};

export const isForInitType = (value: unknown): value is ForInitType => {
    return isCommonType(value) && value.type === 'forInit';
};

export const makeForInitAssignRule: AssignForValueRule<ForInitTypeClass, ForInitType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isForInitTypeClass),
    construct: (controlTypeClass: ForInitTypeClass) => {
        const value = assignMultiClass(controlTypeClass.getValue(), [
            makeLocalVariableDeclarationAssignRule,
            makeExpressionListAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: controlTypeClass.getType(),
            sourceInfo: makeSourceInfo(controlTypeClass),
            value,
        };
    },
};

export type ForUpdateType = CommonType<'forUpdate'> & {
    value: ValueRuleValue<ExpressionListType>;
};

export const isForUpdateType = (value: unknown): value is ForUpdateType => {
    return isCommonType(value) && value.type === 'forUpdate';
};

export const makeForUpdateAssignRule: AssignForValueRule<ForUpdateTypeClass, ForUpdateType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isForUpdateTypeClass),
    construct: (controlTypeClass: ForUpdateTypeClass) => {
        const value = assignMultiClass(controlTypeClass.getValue(), [
            makeExpressionListAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: controlTypeClass.getType(),
            sourceInfo: makeSourceInfo(controlTypeClass),
            value,
        };
    },
};

export type WhenControlType = CommonType<'whenControl'> & {
    value: ValueRuleValue<WhenValueType>;
    block: ValueRuleValue<BlockType>;
};

export const isWhenControlType = (value: unknown): value is WhenControlType => {
    return isCommonType(value) && value.type === 'whenControl';
};

export const makeWhenControlAssignRule: AssignForValueRule<WhenControlTypeClass, WhenControlType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhenControlTypeClass),
        construct: (controlTypeClass: WhenControlTypeClass) => {
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeWhenValueAssignRule,
                makeErrorAssignRule,
            ]);

            const block = assignMultiClass(controlTypeClass.getBlock(), [
                makeBlockAssignRule,
                makeErrorAssignRule,
            ]);

            return {
                type: controlTypeClass.getType(),
                sourceInfo: makeSourceInfo(controlTypeClass),
                value,
                block,
            };
        },
    };
