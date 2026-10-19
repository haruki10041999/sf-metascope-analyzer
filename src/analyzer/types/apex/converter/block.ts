import {
    AnonymousBlockTypeClass,
    BlockListTypeClass,
    BlockTypeClass,
    FinallyBlockTypeClass,
    GetterTypeClass,
    NormalBlockTypeClass,
    PropertyBlockTypeClass,
    SetterTypeClass,
    TriggerBlockTypeClass,
    isAnonymousBlockType,
    isFinallyBlockType,
    isGetterType,
    isNormalBlockType,
    isPropertyBlockType,
    isSetterType,
    isTriggerBlockType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    makeEmptySourceInfoMap,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
} from './commons';
import { makeAnonymousBlockMemberRule, makeTriggerBlockMemberRule } from './member';
import { makeModifierRule } from './modifier';
import { makeStatementRule } from './statement';

export const makeAnonymousBlockRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<AnonymousBlockTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAnonymousBlockType),
        construct: (blockTypeClass: AnonymousBlockTypeClass) => {
            const block = blockTypeClass.getValue().map((v, index) => {
                const nestedSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    makeAnonymousBlockMemberRule(nestedSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                sourceInfo[`${blockTypeClass.getType()}_${index}`] = nestedSourceInfo;
                return value;
            });
            return block;
        },
    };
};

export const makeFinallyBlockRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FinallyBlockTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFinallyBlockType),
        construct: (blockTypeClass: FinallyBlockTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const block = assignMultiClass(blockTypeClass.getValue(), [
                makeBlockRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[blockTypeClass.getType()] = nestedSourceInfo;
            return block;
        },
    };
};

export const makeGetterRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<GetterTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isGetterType),
        construct: (blockTypeClass: GetterTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const block = assignMultiClass(blockTypeClass.getValue(), [
                makeBlockRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[blockTypeClass.getType()] = nestedSourceInfo;
            return { type: blockTypeClass.getType(), block };
        },
    };
};

export const makeBlockRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalBlockTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalBlockType),
        construct: (blockTypeClass: NormalBlockTypeClass) => {
            const block = blockTypeClass.getValue().map((v, index) => {
                const nestedSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    makeStatementRule(nestedSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                sourceInfo[`${blockTypeClass.getType()}_${index}`] = nestedSourceInfo;
                return value;
            });
            return block;
        },
    };
};

export const makePropertyBlockRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<PropertyBlockTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isPropertyBlockType),
        construct: (blockTypeClass: PropertyBlockTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const block = assignMultiClass(blockTypeClass.getValue(), [
                makeSetterRule(nestedSourceInfo, errorInfo),
                makeGetterRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const modifier = assignMultiClass(blockTypeClass.getModifier(), [
                makeModifierRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[blockTypeClass.getType()] = nestedSourceInfo;
            return { block, modifier };
        },
    };
};

export const makeSetterRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SetterTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSetterType),
        construct: (blockTypeClass: SetterTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const block = assignMultiClass(blockTypeClass.getValue(), [
                makeBlockRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[blockTypeClass.getType()] = nestedSourceInfo;
            return { type: blockTypeClass.getType(), block };
        },
    };
};

export const makeTriggerBlockRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TriggerBlockTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTriggerBlockType),
        construct: (blockTypeClass: TriggerBlockTypeClass) => {
            const block = blockTypeClass.getValue().map((v, index) => {
                const nestedSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    makeTriggerBlockMemberRule(nestedSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                sourceInfo[`${blockTypeClass.getType()}_${index}`] = nestedSourceInfo;
                return value;
            });
            return block;
        },
    };
};
