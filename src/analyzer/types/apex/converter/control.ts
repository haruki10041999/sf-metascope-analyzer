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

export const makeEnhancedForControlRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<EnhancedForControlTypeClass, EnhancedForControlType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isEnhancedForControlTypeClass),
        construct: (controlTypeClass: EnhancedForControlTypeClass) => {
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeIdRule(),
                makeErrorAssignRule(errorInfo),
            ]);
            const valueType = assignMultiClass(controlTypeClass.getValueType(), [
                makeTypeRefRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const fromVariant = assignMultiClass(controlTypeClass.getFromVariant(), [
                ...makeBaseExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
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

export const makeForControlRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ForControlTypeClass, ForControlType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForControlTypeClass),
        construct: (controlTypeClass: ForControlTypeClass) => {
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeEnhancedForControlRule(errorInfo),
                ...makeBaseExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);

            const init = assignMultiClass(controlTypeClass.getInit(), [
                makeForInitRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const update = assignMultiClass(controlTypeClass.getUpdate(), [
                makeForUpdateRule(errorInfo),
                makeErrorAssignRule(errorInfo),
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

export const makeForInitRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ForInitTypeClass, ForInitType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForInitTypeClass),
        construct: (controlTypeClass: ForInitTypeClass) => {
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeLocalVariableDeclarationRule(errorInfo),
                makeExpressionListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
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

export const makeForUpdateRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ForUpdateTypeClass, ForUpdateType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForUpdateTypeClass),
        construct: (controlTypeClass: ForUpdateTypeClass) => {
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeExpressionListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
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

export const makeWhenControlRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhenControlTypeClass, WhenControlType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhenControlTypeClass),
        construct: (controlTypeClass: WhenControlTypeClass) => {
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeWhenValueRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const block = assignMultiClass(controlTypeClass.getBlock(), [
                makeBlockRule(errorInfo),
                makeErrorAssignRule(errorInfo),
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

