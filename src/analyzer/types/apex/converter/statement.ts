import typia from 'typia';

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
    isAccessLevelType as isAccessLevelTypeClass,
    isBreakStatementType as isBreakStatementTypeClass,
    isContinueStatementType as isContinueStatementTypeClass,
    isDeleteStatementType as isDeleteStatementTypeClass,
    isDoWhileStatementType as isDoWhileStatementTypeClass,
    isErrorType,
    isExpressionStatementType as isExpressionStatementTypeClass,
    isForStatementType as isForStatementTypeClass,
    isIfStatementType as isIfStatementTypeClass,
    isInsertStatementType as isInsertStatementTypeClass,
    isLocalVariableDeclarationStatementType as isLocalVariableDeclarationStatementTypeClass,
    isMergeStatementType as isMergeStatementTypeClass,
    isNormalStatementType,
    isParExpressionType,
    isReturnStatementType as isReturnStatementTypeClass,
    isRunAsStatementType as isRunAsStatementTypeClass,
    isSwitchStatementType as isSwitchStatementTypeClass,
    isThrowStatementType as isThrowStatementTypeClass,
    isTryStatementType as isTryStatementTypeClass,
    isUndeleteStatementType as isUndeleteStatementTypeClass,
    isUpdateStatementType as isUpdateStatementTypeClass,
    isUpsertStatementType as isUpsertStatementTypeClass,
    isWhileStatementType as isWhileStatementTypeClass,
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
    makeStringAssignRule,
} from './commons';
import {
    makeForControlRule,
    makeWhenControlRule,
    ForControlType,
    WhenControlType,
} from './control';
import { makeLocalVariableDeclarationRule, LocalVariableDeclarationType } from './declaration';
import {
    makeBaseExpressionRule,
    makeParExpressionRule,
    BaseExpressionType,
    ParExpressionType,
} from './expression';
import { makeExpressionListRule, ExpressionListType } from './list';
import { makeQualifiedNameRule, QualifiedNameType } from './name';
import { makeBlockRule, makeFinallyBlockRule, BlockType, FinallyBlockType } from './block';
import { makeCatchClauseRule, CatchClauseType } from './clause';

export type AccessLevelType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isAccessLevelType = typia.createIs<AccessLevelType>();

export const makeAccessLevelRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<AccessLevelTypeClass, AccessLevelType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAccessLevelTypeClass),
        construct: (statementTypeClass: AccessLevelTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
            };
        },
    };
};

export type BreakStatementType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isBreakStatementType = typia.createIs<BreakStatementType>();

export const makeBreakStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<BreakStatementTypeClass, BreakStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBreakStatementTypeClass),
        construct: (statementTypeClass: BreakStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
            };
        },
    };
};

export type ContinueStatementType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isContinueStatementType = typia.createIs<ContinueStatementType>();

export const makeContinueStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ContinueStatementTypeClass, ContinueStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isContinueStatementTypeClass),
        construct: (statementTypeClass: ContinueStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
            };
        },
    };
};

export type DeleteStatementType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isDeleteStatementType = typia.createIs<DeleteStatementType>();

export const makeDeleteStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<DeleteStatementTypeClass, DeleteStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDeleteStatementTypeClass),
        construct: (statementTypeClass: DeleteStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
                accessLevel,
            };
        },
    };
};

export type DoWhileStatementType = CommonType & {
    value: ValueRuleValue<ParExpressionType>;
    block: ValueRuleValue<BlockType>;
};

export const isDoWhileStatementType = typia.createIs<DoWhileStatementType>();

export const makeDoWhileStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<DoWhileStatementTypeClass, DoWhileStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDoWhileStatementTypeClass),
        construct: (statementTypeClass: DoWhileStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeParExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const block = assignMultiClass(statementTypeClass.getBlock(), [
                makeBlockRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
                block,
            };
        },
    };
};

export type ExpressionStatementType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isExpressionStatementType = typia.createIs<ExpressionStatementType>();

export const makeExpressionStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ExpressionStatementTypeClass, ExpressionStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isExpressionStatementTypeClass),
        construct: (statementTypeClass: ExpressionStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
            };
        },
    };
};

export type ForStatementType = CommonType & {
    value: ValueRuleValue<ForControlType>;
    block: ValueRuleValue<StatementType>;
};

export const isForStatementType = typia.createIs<ForStatementType>();

export const makeForStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ForStatementTypeClass, ForStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForStatementTypeClass),
        construct: (statementTypeClass: ForStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeForControlRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const block = assignMultiClass(statementTypeClass.getBlock(), [
                makeStatementRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
                block,
            };
        },
    };
};

export type IfStatementType = CommonType & {
    value: ValueRuleValue<
        {
            condition: ValueRuleValue<ParExpressionType | string>;
            block: ValueRuleValue<StatementType>;
        }[]
    >;
};

export const isIfStatementType = typia.createIs<IfStatementType>();

export const makeIfStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<IfStatementTypeClass, IfStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isIfStatementTypeClass),
        construct: (statementTypeClass: IfStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
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
                        return values.map((v) => {
                            const condition = assignMultiClass(v.value, [
                                makeStringAssignRule,
                                makeParExpressionRule(errorInfo),
                                makeErrorAssignRule(errorInfo),
                            ]);
                            const block = assignMultiClass(v.block, [
                                makeStatementRule(errorInfo),
                                makeErrorAssignRule(errorInfo),
                            ]);
                            return { condition, block };
                        });
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
            };
        },
    };
};

export type InsertStatementType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isInsertStatementType = typia.createIs<InsertStatementType>();

export const makeInsertStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<InsertStatementTypeClass, InsertStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isInsertStatementTypeClass),
        construct: (statementTypeClass: InsertStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
                accessLevel,
            };
        },
    };
};

export type LocalVariableDeclarationStatementType = CommonType & {
    value: ValueRuleValue<LocalVariableDeclarationType>;
};

export const isLocalVariableDeclarationStatementType =
    typia.createIs<LocalVariableDeclarationStatementType>();

export const makeLocalVariableDeclarationStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<
    LocalVariableDeclarationStatementTypeClass,
    LocalVariableDeclarationStatementType
> => {
    return {
        isValid: (target: unknown) =>
            isTargetTypeClass(target, isLocalVariableDeclarationStatementTypeClass),
        construct: (statementTypeClass: LocalVariableDeclarationStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeLocalVariableDeclarationRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
            };
        },
    };
};

export type MergeStatementType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>[];
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isMergeStatementType = typia.createIs<MergeStatementType>();

export const makeMergeStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<MergeStatementTypeClass, MergeStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMergeStatementTypeClass),
        construct: (statementTypeClass: MergeStatementTypeClass) => {
            const value = statementTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [
                        ...makeBaseExpressionRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
                accessLevel,
            };
        },
    };
};

export type ReturnStatementType = CommonType & {
    value: ValueRuleValue<BaseExpressionType | null>;
};

export const isReturnStatementType = typia.createIs<ReturnStatementType>();

export const makeReturnStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ReturnStatementTypeClass, ReturnStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isReturnStatementTypeClass),
        construct: (statementTypeClass: ReturnStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
            };
        },
    };
};

export type RunAsStatementType = CommonType & {
    value: ValueRuleValue<ExpressionListType>;
    block: ValueRuleValue<BlockType>;
};

export const isRunAsStatementType = typia.createIs<RunAsStatementType>();

export const makeRunAsStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<RunAsStatementTypeClass, RunAsStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isRunAsStatementTypeClass),
        construct: (statementTypeClass: RunAsStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeExpressionListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const block = assignMultiClass(statementTypeClass.getBlock(), [
                makeBlockRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
                block,
            };
        },
    };
};

export type SwitchStatementType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
    block: ValueRuleValue<WhenControlType>[];
};

export const isSwitchStatementType = typia.createIs<SwitchStatementType>();

export const makeSwitchStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<SwitchStatementTypeClass, SwitchStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSwitchStatementTypeClass),
        construct: (statementTypeClass: SwitchStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const block = statementTypeClass
                .getBlocks()
                .map((v) =>
                    assignMultiClass(v, [
                        makeWhenControlRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );

            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
                block,
            };
        },
    };
};

export type ThrowStatementType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isThrowStatementType = typia.createIs<ThrowStatementType>();

export const makeThrowStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ThrowStatementTypeClass, ThrowStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isThrowStatementTypeClass),
        construct: (statementTypeClass: ThrowStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
            };
        },
    };
};

export type TryStatementType = CommonType & {
    block: ValueRuleValue<BlockType>;
    catchBlock: ValueRuleValue<CatchClauseType>[];
    finallyBlock: ValueRuleValue<FinallyBlockType | null>;
};

export const isTryStatementType = typia.createIs<TryStatementType>();

export const makeTryStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<TryStatementTypeClass, TryStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTryStatementTypeClass),
        construct: (statementTypeClass: TryStatementTypeClass) => {
            const block = assignMultiClass(statementTypeClass.getValue(), [
                makeBlockRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const catchBlock = statementTypeClass
                .getCatchBlock()
                .map((v) =>
                    assignMultiClass(v, [
                        makeCatchClauseRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            const finallyBlock = assignMultiClass(statementTypeClass.getFinallyBlock(), [
                makeFinallyBlockRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                block,
                catchBlock,
                finallyBlock,
            };
        },
    };
};

export type UndeleteStatementType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isUndeleteStatementType = typia.createIs<UndeleteStatementType>();

export const makeUndeleteStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<UndeleteStatementTypeClass, UndeleteStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUndeleteStatementTypeClass),
        construct: (statementTypeClass: UndeleteStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
                accessLevel,
            };
        },
    };
};

export type UpdateStatementType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isUpdateStatementType = typia.createIs<UpdateStatementType>();

export const makeUpdateStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<UpdateStatementTypeClass, UpdateStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUpdateStatementTypeClass),
        construct: (statementTypeClass: UpdateStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
                accessLevel,
            };
        },
    };
};

export type UpsertStatementType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
    key: ValueRuleValue<QualifiedNameType | null>;
};

export const isUpsertStatementType = typia.createIs<UpsertStatementType>();

export const makeUpsertStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<UpsertStatementTypeClass, UpsertStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUpsertStatementTypeClass),
        construct: (statementTypeClass: UpsertStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const key = assignMultiClass(statementTypeClass.getKey(), [
                makeQualifiedNameRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
                accessLevel,
                key,
            };
        },
    };
};

export type WhileStatementType = CommonType & {
    value: ValueRuleValue<ParExpressionType>;
    block: ValueRuleValue<StatementType>;
};

export const isWhileStatementType = typia.createIs<WhileStatementType>();

export const makeWhileStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhileStatementTypeClass, WhileStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhileStatementTypeClass),
        construct: (statementTypeClass: WhileStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeParExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const block = assignMultiClass(statementTypeClass.getBlock(), [
                makeStatementRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
                block,
            };
        },
    };
};

export type StatementType = CommonType & {
    value: ValueRuleValue<
        | BlockType
        | IfStatementType
        | SwitchStatementType
        | ForStatementType
        | WhileStatementType
        | DoWhileStatementType
        | TryStatementType
        | ReturnStatementType
        | ThrowStatementType
        | BreakStatementType
        | ContinueStatementType
        | InsertStatementType
        | UpdateStatementType
        | DeleteStatementType
        | UndeleteStatementType
        | UpsertStatementType
        | MergeStatementType
        | RunAsStatementType
        | LocalVariableDeclarationStatementType
        | ExpressionStatementType
    >;
};

export const isStatementType = typia.createIs<StatementType>();

export const makeStatementRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalStatementTypeClass, StatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalStatementType),
        construct: (statementTypeClass: NormalStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeBlockRule(errorInfo),
                makeIfStatementRule(errorInfo),
                makeSwitchStatementRule(errorInfo),
                makeForStatementRule(errorInfo),
                makeWhileStatementRule(errorInfo),
                makeDoWhileStatementRule(errorInfo),
                makeTryStatementRule(errorInfo),
                makeReturnStatementRule(errorInfo),
                makeThrowStatementRule(errorInfo),
                makeBreakStatementRule(errorInfo),
                makeContinueStatementRule(errorInfo),
                makeInsertStatementRule(errorInfo),
                makeUpdateStatementRule(errorInfo),
                makeDeleteStatementRule(errorInfo),
                makeUndeleteStatementRule(errorInfo),
                makeUpsertStatementRule(errorInfo),
                makeMergeStatementRule(errorInfo),
                makeRunAsStatementRule(errorInfo),
                makeLocalVariableDeclarationStatementRule(errorInfo),
                makeExpressionStatementRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
            };
        },
    };
};

