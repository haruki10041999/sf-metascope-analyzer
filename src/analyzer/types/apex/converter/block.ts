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
    makeAnonymousBlockMemberRule,
    makeTriggerBlockMemberRule,
    AnonymousBlockMemberType,
    TriggerBlockMemberType,
} from './member';
import { makeModifierRule, ModifierType } from './modifier';
import { makeStatementRule, StatementType } from './statement';

export type AnonymousBlockType = CommonType & {
    value: ValueRuleValue<AnonymousBlockMemberType>[];
};

export const isAnonymousBlockType = typia.createIs<AnonymousBlockType>();

export const makeAnonymousBlockRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<AnonymousBlockTypeClass, AnonymousBlockType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAnonymousBlockTypeClass),
        construct: (blockTypeClass: AnonymousBlockTypeClass) => {
            const value = blockTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [
                        makeAnonymousBlockMemberRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            return {
                type: blockTypeClass.getType(),
                sourceInfo: makeSourceInfo(blockTypeClass),
                value,
            };
        },
    };
};

export type FinallyBlockType = CommonType & {
    block: ValueRuleValue<BlockType>;
};

export const isFinallyBlockType = typia.createIs<FinallyBlockType>();

export const makeFinallyBlockRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<FinallyBlockTypeClass, FinallyBlockType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFinallyBlockTypeClass),
        construct: (blockTypeClass: FinallyBlockTypeClass) => {
            const block = assignMultiClass(blockTypeClass.getValue(), [
                makeBlockRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: blockTypeClass.getType(),
                sourceInfo: makeSourceInfo(blockTypeClass),
                block,
            };
        },
    };
};

export type GetterType = CommonType & {
    block: ValueRuleValue<BlockType | null>;
};

export const isGetterType = typia.createIs<GetterType>();

export const makeGetterRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<GetterTypeClass, GetterType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isGetterTypeClass),
        construct: (blockTypeClass: GetterTypeClass) => {
            const block = assignMultiClass(blockTypeClass.getValue(), [
                makeBlockRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: blockTypeClass.getType(),
                sourceInfo: makeSourceInfo(blockTypeClass),
                block,
            };
        },
    };
};

export type BlockType = CommonType & {
    value: ValueRuleValue<StatementType>[];
};

export const isBlockType = typia.createIs<BlockType>();

export const makeBlockRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalBlockTypeClass, BlockType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalBlockType),
        construct: (blockTypeClass: NormalBlockTypeClass) => {
            const value = blockTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [
                        makeStatementRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            return {
                type: blockTypeClass.getType(),
                sourceInfo: makeSourceInfo(blockTypeClass),
                value,
            };
        },
    };
};

export type PropertyBlockType = CommonType & {
    value: ValueRuleValue<SetterType | GetterType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isPropertyBlockType = typia.createIs<PropertyBlockType>();

export const makePropertyBlockRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<PropertyBlockTypeClass, PropertyBlockType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isPropertyBlockTypeClass),
        construct: (blockTypeClass: PropertyBlockTypeClass) => {
            const value = assignMultiClass(blockTypeClass.getValue(), [
                makeSetterRule(errorInfo),
                makeGetterRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const modifier = blockTypeClass
                .getModifier()
                .map((v) =>
                    assignMultiClass(v, [
                        makeModifierRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            return {
                type: blockTypeClass.getType(),
                sourceInfo: makeSourceInfo(blockTypeClass),
                value,
                modifier,
            };
        },
    };
};

export type SetterType = CommonType & {
    block: ValueRuleValue<BlockType | null>;
};

export const isSetterType = typia.createIs<SetterType>();

export const makeSetterRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<SetterTypeClass, SetterType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSetterTypeClass),
        construct: (blockTypeClass: SetterTypeClass) => {
            const block = assignMultiClass(blockTypeClass.getValue(), [
                makeBlockRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: blockTypeClass.getType(),
                sourceInfo: makeSourceInfo(blockTypeClass),
                block,
            };
        },
    };
};

export type TriggerBlockType = CommonType & {
    value: ValueRuleValue<TriggerBlockMemberType>[];
};

export const isTriggerBlockType = typia.createIs<TriggerBlockType>();

export const makeTriggerBlockRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<TriggerBlockTypeClass, TriggerBlockType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTriggerBlockTypeClass),
        construct: (blockTypeClass: TriggerBlockTypeClass) => {
            const value = blockTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [
                        makeTriggerBlockMemberRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            return {
                type: blockTypeClass.getType(),
                sourceInfo: makeSourceInfo(blockTypeClass),
                value,
            };
        },
    };
};

