import {
    AccessLevelTypeClass,
    BreakStatementTypeClass,
    ContinueStatementTypeClass,
    DeleteStatementTypeClass,
    DoWhileStatementTypeClass,
    ErrorTypeClass,
    ExpressionStatementTypeClass,
    ForStatementTypeClass,
    IfStatementTypeClass,
    InsertStatementTypeClass,
    LocalVariableDeclarationStatementTypeClass,
    MergeStatementTypeClass,
    NormalStatementTypeClass,
    ParExpressionTypeClass,
    ReturnStatementTypeClass,
    RunAsStatementTypeClass,
    SwitchStatementTypeClass,
    ThrowStatementTypeClass,
    TryStatementTypeClass,
    UndeleteStatementTypeClass,
    UpdateStatementTypeClass,
    UpsertStatementTypeClass,
    WhileStatementTypeClass,
    isAccessLevelType,
    isBreakStatementType,
    isContinueStatementType,
    isDeleteStatementType,
    isDoWhileStatementType,
    isErrorType,
    isExpressionStatementType,
    isForStatementType,
    isIfStatementType,
    isInsertStatementType,
    isLocalVariableDeclarationStatementType,
    isMergeStatementType,
    isNormalStatementType,
    isParExpressionType,
    isReturnStatementType,
    isRunAsStatementType,
    isSwitchStatementType,
    isThrowStatementType,
    isTryStatementType,
    isUndeleteStatementType,
    isUpdateStatementType,
    isUpsertStatementType,
    isWhileStatementType,
} from '../../apex_IR';
import { makeBlockRule, makeFinallyBlockRule } from './block';
import { makeCatchClauseRule } from './clause';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    makeEmptySourceInfoMap,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceInfo,
} from './commons';
import { makeForControlRule, makeWhenControlRule } from './control';
import { makeLocalVariableDeclarationRule } from './declaration';
import { makeBaseExpressionRule, makeParExpressionRule } from './expression';
import { makeExpressionListRule } from './list';
import { makeQualifiedNameRule } from './name';

export const makeAccessLevelRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<AccessLevelTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAccessLevelType),
        construct: (statementTypeClass: AccessLevelTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(statementTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        nestedSourceInfo['string'] = value;
                        return value;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeBreakStatementRule = (
    sourceInfo: SourceInfoMap,
): AssignForValueRule<BreakStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBreakStatementType),
        construct: (statementTypeClass: BreakStatementTypeClass) => {
            sourceInfo[statementTypeClass.getType()] = makeSourceInfo(statementTypeClass);
            return statementTypeClass.getValue();
        },
    };
};

export const makeContinueStatementRule = (
    sourceInfo: SourceInfoMap,
): AssignForValueRule<ContinueStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isContinueStatementType),
        construct: (statementTypeClass: ContinueStatementTypeClass) => {
            sourceInfo[statementTypeClass.getType()] = makeSourceInfo(statementTypeClass);
            return statementTypeClass.getValue();
        },
    };
};

export const makeDeleteStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DeleteStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDeleteStatementType),
        construct: (statementTypeClass: DeleteStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const target = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return { type: statementTypeClass.getType(), target, accessLevel };
        },
    };
};

export const makeDoWhileStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DoWhileStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDoWhileStatementType),
        construct: (statementTypeClass: DoWhileStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const condition = assignMultiClass(statementTypeClass.getValue(), [
                makeParExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const block = assignMultiClass(statementTypeClass.getBlock(), [
                makeBlockRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return { condition, block };
        },
    };
};

export const makeExpressionStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ExpressionStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isExpressionStatementType),
        construct: (statementTypeClass: ExpressionStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeForStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ForStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForStatementType),
        construct: (statementTypeClass: ForStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const condition = assignMultiClass(statementTypeClass.getValue(), [
                makeForControlRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const block = assignMultiClass(statementTypeClass.getValue(), [
                makeBlockRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return { condition, block };
        },
    };
};

export const makeIfStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<IfStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isIfStatementType),
        construct: (statementTypeClass: IfStatementTypeClass) => {
            const statement = assignMultiClass(statementTypeClass.getValue(), [
                {
                    isValid: (
                        target: unknown,
                    ): target is {
                        value: ParExpressionTypeClass | string | ErrorTypeClass;
                        block: NormalStatementTypeClass | ErrorTypeClass;
                    }[] =>
                        Array.isArray(target) &&
                        target.every(
                            (t) =>
                                'value' in t &&
                                'block' in t &&
                                (isTargetTypeClass(t.value, isParExpressionType) ||
                                    typeof t.value === 'string' ||
                                    isTargetTypeClass(t.value, isErrorType)) &&
                                (isTargetTypeClass(t.block, isNormalStatementType) ||
                                    isTargetTypeClass(t.block, isErrorType)),
                        ),
                    construct: (
                        values: {
                            value: ParExpressionTypeClass | string | ErrorTypeClass;
                            block: NormalStatementTypeClass | ErrorTypeClass;
                        }[],
                    ) => {
                        const nestedSourceInfo = makeEmptySourceInfoMap();
                        const value = values.forEach((v, index) => {
                            const condition = assignMultiClass(v.value, [
                                {
                                    isValid: (target: unknown): target is string =>
                                        typeof target === 'string',
                                    construct: (value: string) => {
                                        nestedSourceInfo['string'] = value;
                                        return value;
                                    },
                                },
                                makeParExpressionRule(nestedSourceInfo, errorInfo),
                                makeErrorAssignRule(errorInfo),
                            ]);
                            const block = assignMultiClass(v.block, [
                                makeStatementRule(nestedSourceInfo, errorInfo),
                                makeErrorAssignRule(errorInfo),
                            ]);
                            sourceInfo[`${statementTypeClass.getType()}_${index}`] =
                                nestedSourceInfo;
                            return { condition, block };
                        });
                        return value;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
            return statement;
        },
    };
};

export const makeInsertStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<InsertStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isInsertStatementType),
        construct: (statementTypeClass: InsertStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const target = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return { type: statementTypeClass.getType(), target, accessLevel };
        },
    };
};

export const makeLocalVariableDeclarationStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<LocalVariableDeclarationStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) =>
            isTargetTypeClass(target, isLocalVariableDeclarationStatementType),
        construct: (statementTypeClass: LocalVariableDeclarationStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeLocalVariableDeclarationRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeMergeStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<MergeStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMergeStatementType),
        construct: (statementTypeClass: MergeStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const targets = statementTypeClass.getValue().map((v, index) => {
                const valueSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    ...makeBaseExpressionRule(valueSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                nestedSourceInfo[`${statementTypeClass.getType()}_${index}`] = valueSourceInfo;
                return value;
            });
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return { type: statementTypeClass.getType(), targets, accessLevel };
        },
    };
};

export const makeReturnStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ReturnStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isReturnStatementType),
        construct: (statementTypeClass: ReturnStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeRunAsStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<RunAsStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isRunAsStatementType),
        construct: (statementTypeClass: RunAsStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const arg = assignMultiClass(statementTypeClass.getValue(), [
                makeExpressionListRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const block = assignMultiClass(statementTypeClass.getBlock(), [
                makeBlockRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return { arg, block };
        },
    };
};

export const makeSwitchStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SwitchStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSwitchStatementType),
        construct: (statementTypeClass: SwitchStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const variant = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const conditionBlocks = statementTypeClass.getBlocks().forEach((v, index) => {
                const valueSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    makeWhenControlRule(valueSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                nestedSourceInfo[`${statementTypeClass.getType()}_${index}`] = valueSourceInfo;
                return value;
            });

            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return { variant, conditionBlocks };
        },
    };
};

export const makeThrowStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ThrowStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isThrowStatementType),
        construct: (statementTypeClass: ThrowStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeTryStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TryStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTryStatementType),
        construct: (statementTypeClass: TryStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const tryBlock = assignMultiClass(statementTypeClass.getValue(), [
                makeBlockRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const catchBlock = statementTypeClass.getCatchBlock().forEach((v, index) => {
                const valueSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    makeCatchClauseRule(valueSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                nestedSourceInfo[`${statementTypeClass.getType}_${index}`] = valueSourceInfo;
                return value;
            });
            const finallyBlock = assignMultiClass(statementTypeClass.getFinallyBlock(), [
                makeFinallyBlockRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return { tryBlock, catchBlock, finallyBlock };
        },
    };
};

export const makeUndeleteStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<UndeleteStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUndeleteStatementType),
        construct: (statementTypeClass: UndeleteStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const target = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return { type: statementTypeClass.getType(), target, accessLevel };
        },
    };
};

export const makeUpdateStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<UpdateStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUpdateStatementType),
        construct: (statementTypeClass: UpdateStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const target = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return { type: statementTypeClass.getType(), target, accessLevel };
        },
    };
};

export const makeUpsertStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<UpsertStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUpsertStatementType),
        construct: (statementTypeClass: UpsertStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const target = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const key = assignMultiClass(statementTypeClass.getKey(), [
                makeQualifiedNameRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return { type: statementTypeClass.getType(), target, accessLevel, key };
        },
    };
};

export const makeWhileStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhileStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhileStatementType),
        construct: (statementTypeClass: WhileStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const condition = assignMultiClass(statementTypeClass.getValue(), [
                makeParExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const block = assignMultiClass(statementTypeClass.getBlock(), [
                makeStatementRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[statementTypeClass.getType()] = nestedSourceInfo;
            return { condition };
        },
    };
};

export const makeStatementRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalStatementTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalStatementType),
        construct: (statementTypeClass: NormalStatementTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const block = assignMultiClass(statementTypeClass.getValue(), [
                makeBlockRule(nestedSourceInfo, errorInfo),
                makeIfStatementRule(nestedSourceInfo, errorInfo),
                makeSwitchStatementRule(nestedSourceInfo, errorInfo),
                makeForControlRule(nestedSourceInfo, errorInfo),
                makeWhileStatementRule(nestedSourceInfo, errorInfo),
                makeDoWhileStatementRule(nestedSourceInfo, errorInfo),
                makeTryStatementRule(nestedSourceInfo, errorInfo),
                makeReturnStatementRule(nestedSourceInfo, errorInfo),
                makeThrowStatementRule(nestedSourceInfo, errorInfo),
                makeBreakStatementRule(nestedSourceInfo),
                makeContinueStatementRule(nestedSourceInfo),
                makeInsertStatementRule(nestedSourceInfo, errorInfo),
                makeUpdateStatementRule(nestedSourceInfo, errorInfo),
                makeDeleteStatementRule(nestedSourceInfo, errorInfo),
                makeUndeleteStatementRule(nestedSourceInfo, errorInfo),
                makeUpsertStatementRule(nestedSourceInfo, errorInfo),
                makeMergeStatementRule(nestedSourceInfo, errorInfo),
                makeRunAsStatementRule(nestedSourceInfo, errorInfo),
                makeLocalVariableDeclarationRule(nestedSourceInfo, errorInfo),
                makeExpressionStatementRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
        },
    };
};
