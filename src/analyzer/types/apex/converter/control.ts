import typia from 'typia';

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
    ErrorInfo,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeNullAssignRule,
    makeSourceInfo,
} from './commons';
import { makeBaseExpressionRule, BaseExpressionType } from './expression';
import { makeIdRule, IdType } from './id';
import { makeTypeRefRule, TypeRefType } from './type';
import { makeLocalVariableDeclarationRule, LocalVariableDeclarationType } from './declaration';
import { makeExpressionListRule, ExpressionListType } from './list';
import { makeWhenValueRule, WhenValueType } from './value';
import { makeBlockRule, BlockType } from './block';

export type EnhancedForControlType = CommonType & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    fromVariant: ValueRuleValue<BaseExpressionType>;
};

export const isEnhancedForControlType = typia.createIs<EnhancedForControlType>();

export const makeEnhancedForControlRule = (): AssignForValueRule<
    EnhancedForControlTypeClass,
    EnhancedForControlType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isEnhancedForControlTypeClass),
        construct: (controlTypeClass: EnhancedForControlTypeClass) => {
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeIdRule(),
                makeErrorAssignRule,
            ]);
            const valueType = assignMultiClass(controlTypeClass.getValueType(), [
                makeTypeRefRule(),
                makeErrorAssignRule,
            ]);

            const fromVariant = assignMultiClass(controlTypeClass.getFromVariant(), [
                ...makeBaseExpressionRule(),
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
};

export type ForControlType = CommonType & {
    value: ValueRuleValue<EnhancedForControlType | BaseExpressionType | null>;
    init: ValueRuleValue<ForInitType | null>;
    update: ValueRuleValue<ForUpdateType | null>;
};

export const isForControlType = typia.createIs<ForControlType>();

export const makeForControlRule = (): AssignForValueRule<ForControlTypeClass, ForControlType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForControlTypeClass),
        construct: (controlTypeClass: ForControlTypeClass) => {
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeEnhancedForControlRule(),
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);

            const init = assignMultiClass(controlTypeClass.getInit(), [
                makeForInitRule(),
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);
            const update = assignMultiClass(controlTypeClass.getUpdate(), [
                makeForUpdateRule(),
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
};

export type ForInitType = CommonType & {
    value: ValueRuleValue<LocalVariableDeclarationType | ExpressionListType>;
};

export const isForInitType = typia.createIs<ForInitType>();

export const makeForInitRule = (): AssignForValueRule<ForInitTypeClass, ForInitType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForInitTypeClass),
        construct: (controlTypeClass: ForInitTypeClass) => {
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeLocalVariableDeclarationRule(),
                makeExpressionListRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: controlTypeClass.getType(),
                sourceInfo: makeSourceInfo(controlTypeClass),
                value,
            };
        },
    };
};

export type ForUpdateType = CommonType & {
    value: ValueRuleValue<ExpressionListType>;
};

export const isForUpdateType = typia.createIs<ForUpdateType>();

export const makeForUpdateRule = (): AssignForValueRule<ForUpdateTypeClass, ForUpdateType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForUpdateTypeClass),
        construct: (controlTypeClass: ForUpdateTypeClass) => {
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeExpressionListRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: controlTypeClass.getType(),
                sourceInfo: makeSourceInfo(controlTypeClass),
                value,
            };
        },
    };
};

export type WhenControlType = CommonType & {
    value: ValueRuleValue<WhenValueType>;
    block: ValueRuleValue<BlockType>;
};

export const isWhenControlType = typia.createIs<WhenControlType>();

export const makeWhenControlRule = (): AssignForValueRule<
    WhenControlTypeClass,
    WhenControlType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhenControlTypeClass),
        construct: (controlTypeClass: WhenControlTypeClass) => {
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeWhenValueRule(),
                makeErrorAssignRule,
            ]);

            const block = assignMultiClass(controlTypeClass.getBlock(), [
                makeBlockRule(),
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
};

