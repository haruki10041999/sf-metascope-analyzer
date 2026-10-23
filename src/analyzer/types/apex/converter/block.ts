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
import {
    makeAnonymousBlockMemberAssignRule,
    makeTriggerBlockMemberAssignRule,
    AnonymousBlockMemberType,
    TriggerBlockMemberType,
} from './member';
import { makeModifierAssignRule, ModifierType } from './modifier';
import { makeStatementAssignRule, StatementType } from './statement';

export type AnonymousBlockType = CommonType<'anonymousBlock'> & {
    value: ValueRuleValue<AnonymousBlockMemberType>[];
};

export const isAnonymousBlockType = (value: unknown): value is AnonymousBlockType => {
    return isCommonType(value) && value.type === 'anonymousBlock';
};

export const makeAnonymousBlockAssignRule: AssignForValueRule<
    AnonymousBlockTypeClass,
    AnonymousBlockType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isAnonymousBlockTypeClass),
    construct: (blockTypeClass: AnonymousBlockTypeClass) => {
        const value = blockTypeClass
            .getValue()
            .map((v) =>
                assignMultiClass(v, [makeAnonymousBlockMemberAssignRule, makeErrorAssignRule]),
            );
        return {
            type: blockTypeClass.getType(),
            sourceInfo: makeSourceInfo(blockTypeClass),
            value,
        };
    },
};

export type FinallyBlockType = CommonType<'finallyBlock'> & {
    block: ValueRuleValue<BlockType>;
};

export const isFinallyBlockType = (value: unknown): value is FinallyBlockType => {
    return isCommonType(value) && value.type === 'finallyBlock';
};

export const makeFinallyBlockAssignRule: AssignForValueRule<
    FinallyBlockTypeClass,
    FinallyBlockType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFinallyBlockTypeClass),
    construct: (blockTypeClass: FinallyBlockTypeClass) => {
        const block = assignMultiClass(blockTypeClass.getValue(), [
            makeBlockAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: blockTypeClass.getType(),
            sourceInfo: makeSourceInfo(blockTypeClass),
            block,
        };
    },
};

export type GetterType = CommonType<'getter'> & {
    block: ValueRuleValue<BlockType | null>;
};

export const isGetterType = (value: unknown): value is GetterType => {
    return isCommonType(value) && value.type === 'getter';
};

export const makeGetterAssignRule: AssignForValueRule<GetterTypeClass, GetterType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isGetterTypeClass),
    construct: (blockTypeClass: GetterTypeClass) => {
        const block = assignMultiClass(blockTypeClass.getValue(), [
            makeBlockAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        return {
            type: blockTypeClass.getType(),
            sourceInfo: makeSourceInfo(blockTypeClass),
            block,
        };
    },
};

export type BlockType = CommonType<'block'> & {
    value: ValueRuleValue<StatementType>[];
};

export const isBlockType = (value: unknown): value is BlockType => {
    return isCommonType(value) && value.type === 'block';
};

export const makeBlockAssignRule: AssignForValueRule<NormalBlockTypeClass, BlockType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalBlockType),
    construct: (blockTypeClass: NormalBlockTypeClass) => {
        const value = blockTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeStatementAssignRule, makeErrorAssignRule]));
        return {
            type: blockTypeClass.getType(),
            sourceInfo: makeSourceInfo(blockTypeClass),
            value,
        };
    },
};

export type PropertyBlockType = CommonType<'propertyBlock'> & {
    value: ValueRuleValue<SetterType | GetterType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isPropertyBlockType = (value: unknown): value is PropertyBlockType => {
    return isCommonType(value) && value.type === 'propertyBlock';
};

export const makePropertyBlockAssignRule: AssignForValueRule<
    PropertyBlockTypeClass,
    PropertyBlockType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isPropertyBlockTypeClass),
    construct: (blockTypeClass: PropertyBlockTypeClass) => {
        const value = assignMultiClass(blockTypeClass.getValue(), [
            makeSetterAssignRule,
            makeGetterAssignRule,
            makeErrorAssignRule,
        ]);
        const modifier = blockTypeClass
            .getModifier()
            .map((v) => assignMultiClass(v, [makeModifierAssignRule, makeErrorAssignRule]));
        return {
            type: blockTypeClass.getType(),
            sourceInfo: makeSourceInfo(blockTypeClass),
            value,
            modifier,
        };
    },
};

export type SetterType = CommonType<'setter'> & {
    block: ValueRuleValue<BlockType | null>;
};

export const isSetterType = (value: unknown): value is SetterType => {
    return isCommonType(value) && value.type === 'setter';
};

export const makeSetterAssignRule: AssignForValueRule<SetterTypeClass, SetterType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSetterTypeClass),
    construct: (blockTypeClass: SetterTypeClass) => {
        const block = assignMultiClass(blockTypeClass.getValue(), [
            makeBlockAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        return {
            type: blockTypeClass.getType(),
            sourceInfo: makeSourceInfo(blockTypeClass),
            block,
        };
    },
};

export type TriggerBlockType = CommonType<'triggerBlock'> & {
    value: ValueRuleValue<TriggerBlockMemberType>[];
};

export const isTriggerBlockType = (value: unknown): value is TriggerBlockType => {
    return isCommonType(value) && value.type === 'triggerBlock';
};

export const makeTriggerBlockAssignRule: AssignForValueRule<
    TriggerBlockTypeClass,
    TriggerBlockType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isTriggerBlockTypeClass),
    construct: (blockTypeClass: TriggerBlockTypeClass) => {
        const value = blockTypeClass
            .getValue()
            .map((v) =>
                assignMultiClass(v, [makeTriggerBlockMemberAssignRule, makeErrorAssignRule]),
            );
        return {
            type: blockTypeClass.getType(),
            sourceInfo: makeSourceInfo(blockTypeClass),
            value,
        };
    },
};
