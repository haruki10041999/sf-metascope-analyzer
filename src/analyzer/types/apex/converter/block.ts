import typia from 'typia';

import {
    AnonymousBlockTypeClass,
    FinallyBlockTypeClass,
    GetterTypeClass,
    NormalBlockTypeClass,
    PropertyBlockTypeClass,
    SetterTypeClass,
    TriggerBlockTypeClass,
    isAnonymousBlockType as isAnonymousBlockTypeClass,
    isFinallyBlockType as isFinallyBlockTypeClass,
    isGetterType as isGetterTypeClass,
    isNormalBlockType,
    isPropertyBlockType as isPropertyBlockTypeClass,
    isSetterType as isSetterTypeClass,
    isTriggerBlockType as isTriggerBlockTypeClass,
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
    sourceList,
} from './commons';
import {
    makeAnonymousBlockMemberRule,
    makeTriggerBlockMemberRule,
    AnonymousBlockMemberType,
    TriggerBlockMemberType,
} from './member';
import { makeModifierRule, ModifierType } from './modifier';
import { makeStatementRule, StatementType } from './statement';

export type AnonymousBlockType = {
    type: string;
    value: ValueRuleValue<AnonymousBlockMemberType>[];
};

export const isAnonymousBlockType = typia.createIs<AnonymousBlockType>();

export const makeAnonymousBlockRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<AnonymousBlockTypeClass, AnonymousBlockType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAnonymousBlockTypeClass),
        construct: (blockTypeClass: AnonymousBlockTypeClass) => {
            const node = makeSourceNode(blockTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = blockTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeAnonymousBlockMemberRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: blockTypeClass.getType(), value };
        },
    };
};

export type FinallyBlockType = {
    type: string;
    block: ValueRuleValue<BlockType>;
};

export const isFinallyBlockType = typia.createIs<FinallyBlockType>();

export const makeFinallyBlockRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FinallyBlockTypeClass, FinallyBlockType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFinallyBlockTypeClass),
        construct: (blockTypeClass: FinallyBlockTypeClass) => {
            const node = makeSourceNode(blockTypeClass);
            const block = assignMultiClass(blockTypeClass.getValue(), [
                makeBlockRule(sourceField(node, 'block'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: blockTypeClass.getType(), block };
        },
    };
};

export type GetterType = {
    type: string;
    block: ValueRuleValue<BlockType>;
};

export const isGetterType = typia.createIs<GetterType>();

export const makeGetterRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<GetterTypeClass, GetterType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isGetterTypeClass),
        construct: (blockTypeClass: GetterTypeClass) => {
            const node = makeSourceNode(blockTypeClass);
            const block = assignMultiClass(blockTypeClass.getValue(), [
                makeBlockRule(sourceField(node, 'block'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: blockTypeClass.getType(), block };
        },
    };
};

export type BlockType = {
    type: string;
    value: ValueRuleValue<StatementType>[];
};

export const isBlockType = typia.createIs<BlockType>();

export const makeBlockRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalBlockTypeClass, BlockType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalBlockType),
        construct: (blockTypeClass: NormalBlockTypeClass) => {
            const node = makeSourceNode(blockTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = blockTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeStatementRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: blockTypeClass.getType(), value };
        },
    };
};

export type PropertyBlockType = {
    type: string;
    value: ValueRuleValue<SetterType | GetterType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isPropertyBlockType = typia.createIs<PropertyBlockType>();

export const makePropertyBlockRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<PropertyBlockTypeClass, PropertyBlockType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isPropertyBlockTypeClass),
        construct: (blockTypeClass: PropertyBlockTypeClass) => {
            const node = makeSourceNode(blockTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(blockTypeClass.getValue(), [
                makeSetterRule(valueSource, errorInfo),
                makeGetterRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const modifierSource = sourceList(node, 'modifier');
            const modifier = blockTypeClass
                .getModifier()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeModifierRule(modifierSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: blockTypeClass.getType(), value, modifier };
        },
    };
};

export type SetterType = {
    type: string;
    block: ValueRuleValue<BlockType>;
};

export const isSetterType = typia.createIs<SetterType>();

export const makeSetterRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SetterTypeClass, SetterType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSetterTypeClass),
        construct: (blockTypeClass: SetterTypeClass) => {
            const node = makeSourceNode(blockTypeClass);
            const block = assignMultiClass(blockTypeClass.getValue(), [
                makeBlockRule(sourceField(node, 'block'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: blockTypeClass.getType(), block };
        },
    };
};

export type TriggerBlockType = {
    type: string;
    value: ValueRuleValue<TriggerBlockMemberType>[];
};

export const isTriggerBlockType = typia.createIs<TriggerBlockType>();

export const makeTriggerBlockRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TriggerBlockTypeClass, TriggerBlockType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTriggerBlockTypeClass),
        construct: (blockTypeClass: TriggerBlockTypeClass) => {
            const node = makeSourceNode(blockTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = blockTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeTriggerBlockMemberRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: blockTypeClass.getType(), value };
        },
    };
};

