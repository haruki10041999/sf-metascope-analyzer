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
    SourceSlot,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceNode,
    sourceField,
} from './commons';
import { makeBaseExpressionRule, BaseExpressionType } from './expression';
import { makeIdRule, IdType } from './id';
import { makeTypeRefRule, TypeRefType } from './type';
import { makeLocalVariableDeclarationRule, LocalVariableDeclarationType } from './declaration';
import { makeExpressionListRule, ExpressionListType } from './list';
import { makeWhenValueRule, WhenValueType } from './value';
import { makeBlockRule, BlockType } from './block';

export type EnhancedForControlType = {
    type: string;
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    fromVariant: ValueRuleValue<BaseExpressionType>;
};

export const isEnhancedForControlType = typia.createIs<EnhancedForControlType>();

export const makeEnhancedForControlRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<EnhancedForControlTypeClass, EnhancedForControlType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isEnhancedForControlTypeClass),
        construct: (controlTypeClass: EnhancedForControlTypeClass) => {
            const node = makeSourceNode(controlTypeClass);
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeIdRule(sourceField(node, 'value')),
                makeErrorAssignRule(errorInfo),
            ]);
            const valueType = assignMultiClass(controlTypeClass.getValueType(), [
                makeTypeRefRule(sourceField(node, 'valueType'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const fromVariant = assignMultiClass(controlTypeClass.getFromVariant(), [
                ...makeBaseExpressionRule(sourceField(node, 'fromVariant'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: controlTypeClass.getType(), value, valueType, fromVariant };
        },
    };
};

export type ForControlType = {
    type: string;
    value: ValueRuleValue<EnhancedForControlType | BaseExpressionType>;
    init: ValueRuleValue<ForInitType>;
    update: ValueRuleValue<ForUpdateType>;
};

export const isForControlType = typia.createIs<ForControlType>();

export const makeForControlRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ForControlTypeClass, ForControlType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForControlTypeClass),
        construct: (controlTypeClass: ForControlTypeClass) => {
            const node = makeSourceNode(controlTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeEnhancedForControlRule(valueSource, errorInfo),
                ...makeBaseExpressionRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const init = assignMultiClass(controlTypeClass.getInit(), [
                makeForInitRule(sourceField(node, 'init'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const update = assignMultiClass(controlTypeClass.getUpdate(), [
                makeForUpdateRule(sourceField(node, 'update'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: controlTypeClass.getType(), value, init, update };
        },
    };
};

export type ForInitType = {
    type: string;
    value: ValueRuleValue<LocalVariableDeclarationType | ExpressionListType>;
};

export const isForInitType = typia.createIs<ForInitType>();

export const makeForInitRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ForInitTypeClass, ForInitType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForInitTypeClass),
        construct: (controlTypeClass: ForInitTypeClass) => {
            const node = makeSourceNode(controlTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeLocalVariableDeclarationRule(valueSource, errorInfo),
                makeExpressionListRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: controlTypeClass.getType(), value };
        },
    };
};

export type ForUpdateType = {
    type: string;
    value: ValueRuleValue<ExpressionListType>;
};

export const isForUpdateType = typia.createIs<ForUpdateType>();

export const makeForUpdateRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ForUpdateTypeClass, ForUpdateType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForUpdateTypeClass),
        construct: (controlTypeClass: ForUpdateTypeClass) => {
            const node = makeSourceNode(controlTypeClass);
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeExpressionListRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: controlTypeClass.getType(), value };
        },
    };
};

export type WhenControlType = {
    type: string;
    value: ValueRuleValue<WhenValueType>;
    block: ValueRuleValue<BlockType>;
};

export const isWhenControlType = typia.createIs<WhenControlType>();

export const makeWhenControlRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhenControlTypeClass, WhenControlType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhenControlTypeClass),
        construct: (controlTypeClass: WhenControlTypeClass) => {
            const node = makeSourceNode(controlTypeClass);
            const value = assignMultiClass(controlTypeClass.getValue(), [
                makeWhenValueRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const block = assignMultiClass(controlTypeClass.getBlock(), [
                makeBlockRule(sourceField(node, 'block'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: controlTypeClass.getType(), value, block };
        },
    };
};

