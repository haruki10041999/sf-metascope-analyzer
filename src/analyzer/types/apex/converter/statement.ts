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
    isCommonType,
    makeLimitedStringAssignRule,
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
    makeForControlAssignRule,
    makeWhenControlAssignRule,
    ForControlType,
    WhenControlType,
} from './control';
import {
    makeLocalVariableDeclarationAssignRule,
    LocalVariableDeclarationType,
} from './declaration';
import {
    makeBaseExpressionAssignRules,
    makeParExpressionAssignRule,
    BaseExpressionType,
    ParExpressionType,
} from './expression';
import { makeExpressionListAssignRule, ExpressionListType } from './list';
import { makeQualifiedNameAssignRule, QualifiedNameType } from './name';
import {
    makeBlockAssignRule,
    makeFinallyBlockAssignRule,
    BlockType,
    FinallyBlockType,
} from './block';
import { makeCatchClauseAssignRule, CatchClauseType } from './clause';

export type AccessLevelType = CommonType<'accessLevel'> & {
    value: 'SYSTEM' | 'USER';
};

export const isAccessLevelType = (value: unknown): value is AccessLevelType => {
    return isCommonType(value) && value.type === 'accessLevel';
};

export const makeAccessLevelAssignRule: AssignForValueRule<AccessLevelTypeClass, AccessLevelType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isAccessLevelTypeClass),
        construct: (statementTypeClass: AccessLevelTypeClass) => {
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value: statementTypeClass.getValue(),
            };
        },
    };

export type BreakStatementType = CommonType<'breakStatement'> & {
    value: string;
};

export const isBreakStatementType = (value: unknown): value is BreakStatementType => {
    return isCommonType(value) && value.type === 'breakStatement';
};

export const makeBreakStatementAssignRule: AssignForValueRule<
    BreakStatementTypeClass,
    BreakStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isBreakStatementTypeClass),
    construct: (statementTypeClass: BreakStatementTypeClass) => {
        return {
            type: statementTypeClass.getType(),
            sourceInfo: makeSourceInfo(statementTypeClass),
            value: statementTypeClass.getValue(),
        };
    },
};

export type ContinueStatementType = CommonType<'continueStatement'> & {
    value: string;
};

export const isContinueStatementType = (value: unknown): value is ContinueStatementType => {
    return isCommonType(value) && value.type === 'continueStatement';
};

export const makeContinueStatementAssignRule: AssignForValueRule<
    ContinueStatementTypeClass,
    ContinueStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isContinueStatementTypeClass),
    construct: (statementTypeClass: ContinueStatementTypeClass) => {
        return {
            type: statementTypeClass.getType(),
            sourceInfo: makeSourceInfo(statementTypeClass),
            value: statementTypeClass.getValue(),
        };
    },
};

export type DeleteStatementType = CommonType<'deleteStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isDeleteStatementType = (value: unknown): value is DeleteStatementType => {
    return isCommonType(value) && value.type === 'deleteStatement';
};

export const makeDeleteStatementAssignRule: AssignForValueRule<
    DeleteStatementTypeClass,
    DeleteStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isDeleteStatementTypeClass),
    construct: (statementTypeClass: DeleteStatementTypeClass) => {
        const value = assignMultiClass(statementTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
            makeAccessLevelAssignRule,
            makeErrorAssignRule,
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

export type DoWhileStatementType = CommonType<'doWhileStatement'> & {
    value: ValueRuleValue<ParExpressionType>;
    block: ValueRuleValue<BlockType>;
};

export const isDoWhileStatementType = (value: unknown): value is DoWhileStatementType => {
    return isCommonType(value) && value.type === 'doWhileStatement';
};

export const makeDoWhileStatementAssignRule: AssignForValueRule<
    DoWhileStatementTypeClass,
    DoWhileStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isDoWhileStatementTypeClass),
    construct: (statementTypeClass: DoWhileStatementTypeClass) => {
        const value = assignMultiClass(statementTypeClass.getValue(), [
            makeParExpressionAssignRule,
            makeErrorAssignRule,
        ]);
        const block = assignMultiClass(statementTypeClass.getBlock(), [
            makeBlockAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: statementTypeClass.getType(),
            sourceInfo: makeSourceInfo(statementTypeClass),
            value,
            block,
        };
    },
};

export type ExpressionStatementType = CommonType<'expressionStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isExpressionStatementType = (value: unknown): value is ExpressionStatementType => {
    return isCommonType(value) && value.type === 'expressionStatement';
};

export const makeExpressionStatementAssignRule: AssignForValueRule<
    ExpressionStatementTypeClass,
    ExpressionStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isExpressionStatementTypeClass),
    construct: (statementTypeClass: ExpressionStatementTypeClass) => {
        const value = assignMultiClass(statementTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        return {
            type: statementTypeClass.getType(),
            sourceInfo: makeSourceInfo(statementTypeClass),
            value,
        };
    },
};

export type ForStatementType = CommonType<'forStatement'> & {
    value: ValueRuleValue<ForControlType>;
    block: ValueRuleValue<StatementType>;
};

export const isForStatementType = (value: unknown): value is ForStatementType => {
    return isCommonType(value) && value.type === 'forStatement';
};

export const makeForStatementAssignRule: AssignForValueRule<
    ForStatementTypeClass,
    ForStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isForStatementTypeClass),
    construct: (statementTypeClass: ForStatementTypeClass) => {
        const value = assignMultiClass(statementTypeClass.getValue(), [
            makeForControlAssignRule,
            makeErrorAssignRule,
        ]);
        const block = assignMultiClass(statementTypeClass.getBlock(), [
            makeStatementAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: statementTypeClass.getType(),
            sourceInfo: makeSourceInfo(statementTypeClass),
            value,
            block,
        };
    },
};

export type IfStatementType = CommonType<'ifStatement'> & {
    value: ValueRuleValue<
        {
            condition: ValueRuleValue<ParExpressionType | 'else'>;
            block: ValueRuleValue<StatementType>;
        }[]
    >;
};

export const isIfStatementType = (value: unknown): value is IfStatementType => {
    return isCommonType(value) && value.type === 'ifStatement';
};

export const makeIfStatementAssignRule: AssignForValueRule<IfStatementTypeClass, IfStatementType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isIfStatementTypeClass),
        construct: (statementTypeClass: IfStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                {
                    isValid: (
                        target: unknown,
                    ): target is {
                        value: ParExpressionTypeClass | 'else' | ErrorTypeClass;
                        block: NormalStatementTypeClass | ErrorTypeClass;
                    }[] =>
                        Array.isArray(target) &&
                        target.every(
                            (t) =>
                                'value' in t &&
                                'block' in t &&
                                (isTargetTypeClass(t.value, isParExpressionType) ||
                                    (typeof t.value === 'string' && t.value === 'else') ||
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
                                makeLimitedStringAssignRule(['else']),
                                makeParExpressionAssignRule,
                                makeErrorAssignRule,
                            ]);
                            const block = assignMultiClass(v.block, [
                                makeStatementAssignRule,
                                makeErrorAssignRule,
                            ]);
                            return { condition, block };
                        });
                    },
                },
                makeErrorAssignRule,
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
            };
        },
    };

export type InsertStatementType = CommonType<'insertStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isInsertStatementType = (value: unknown): value is InsertStatementType => {
    return isCommonType(value) && value.type === 'insertStatement';
};

export const makeInsertStatementAssignRule: AssignForValueRule<
    InsertStatementTypeClass,
    InsertStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isInsertStatementTypeClass),
    construct: (statementTypeClass: InsertStatementTypeClass) => {
        const value = assignMultiClass(statementTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
            makeAccessLevelAssignRule,
            makeErrorAssignRule,
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

export type LocalVariableDeclarationStatementType =
    CommonType<'localVariableDeclarationStatement'> & {
        value: ValueRuleValue<LocalVariableDeclarationType>;
    };

export const isLocalVariableDeclarationStatementType = (
    value: unknown,
): value is LocalVariableDeclarationStatementType => {
    return isCommonType(value) && value.type === 'localVariableDeclarationStatement';
};

export const makeLocalVariableDeclarationStatementAssignRule: AssignForValueRule<
    LocalVariableDeclarationStatementTypeClass,
    LocalVariableDeclarationStatementType
> = {
    isValid: (target: unknown) =>
        isTargetTypeClass(target, isLocalVariableDeclarationStatementTypeClass),
    construct: (statementTypeClass: LocalVariableDeclarationStatementTypeClass) => {
        const value = assignMultiClass(statementTypeClass.getValue(), [
            makeLocalVariableDeclarationAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: statementTypeClass.getType(),
            sourceInfo: makeSourceInfo(statementTypeClass),
            value,
        };
    },
};

export type MergeStatementType = CommonType<'mergeStatement'> & {
    value: ValueRuleValue<BaseExpressionType>[];
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isMergeStatementType = (value: unknown): value is MergeStatementType => {
    return isCommonType(value) && value.type === 'mergeStatement';
};

export const makeMergeStatementAssignRule: AssignForValueRule<
    MergeStatementTypeClass,
    MergeStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isMergeStatementTypeClass),
    construct: (statementTypeClass: MergeStatementTypeClass) => {
        const value = statementTypeClass
            .getValue()
            .map((v) =>
                assignMultiClass(v, [...makeBaseExpressionAssignRules, makeErrorAssignRule]),
            );
        const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
            makeAccessLevelAssignRule,
            makeErrorAssignRule,
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

export type ReturnStatementType = CommonType<'returnStatement'> & {
    value: ValueRuleValue<BaseExpressionType | null>;
};

export const isReturnStatementType = (value: unknown): value is ReturnStatementType => {
    return isCommonType(value) && value.type === 'returnStatement';
};

export const makeReturnStatementAssignRule: AssignForValueRule<
    ReturnStatementTypeClass,
    ReturnStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isReturnStatementTypeClass),
    construct: (statementTypeClass: ReturnStatementTypeClass) => {
        const value = assignMultiClass(statementTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        return {
            type: statementTypeClass.getType(),
            sourceInfo: makeSourceInfo(statementTypeClass),
            value,
        };
    },
};

export type RunAsStatementType = CommonType<'runAsStatement'> & {
    value: ValueRuleValue<ExpressionListType>;
    block: ValueRuleValue<BlockType>;
};

export const isRunAsStatementType = (value: unknown): value is RunAsStatementType => {
    return isCommonType(value) && value.type === 'runAsStatement';
};

export const makeRunAsStatementAssignRule: AssignForValueRule<
    RunAsStatementTypeClass,
    RunAsStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isRunAsStatementTypeClass),
    construct: (statementTypeClass: RunAsStatementTypeClass) => {
        const value = assignMultiClass(statementTypeClass.getValue(), [
            makeExpressionListAssignRule,
            makeErrorAssignRule,
        ]);
        const block = assignMultiClass(statementTypeClass.getBlock(), [
            makeBlockAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: statementTypeClass.getType(),
            sourceInfo: makeSourceInfo(statementTypeClass),
            value,
            block,
        };
    },
};

export type SwitchStatementType = CommonType<'switchStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    block: ValueRuleValue<WhenControlType>[];
};

export const isSwitchStatementType = (value: unknown): value is SwitchStatementType => {
    return isCommonType(value) && value.type === 'switchStatement';
};

export const makeSwitchStatementAssignRule: AssignForValueRule<
    SwitchStatementTypeClass,
    SwitchStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSwitchStatementTypeClass),
    construct: (statementTypeClass: SwitchStatementTypeClass) => {
        const value = assignMultiClass(statementTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const block = statementTypeClass
            .getBlocks()
            .map((v) => assignMultiClass(v, [makeWhenControlAssignRule, makeErrorAssignRule]));

        return {
            type: statementTypeClass.getType(),
            sourceInfo: makeSourceInfo(statementTypeClass),
            value,
            block,
        };
    },
};

export type ThrowStatementType = CommonType<'throwStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isThrowStatementType = (value: unknown): value is ThrowStatementType => {
    return isCommonType(value) && value.type === 'throwStatement';
};

export const makeThrowStatementAssignRule: AssignForValueRule<
    ThrowStatementTypeClass,
    ThrowStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isThrowStatementTypeClass),
    construct: (statementTypeClass: ThrowStatementTypeClass) => {
        const value = assignMultiClass(statementTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        return {
            type: statementTypeClass.getType(),
            sourceInfo: makeSourceInfo(statementTypeClass),
            value,
        };
    },
};

export type TryStatementType = CommonType<'tryStatement'> & {
    block: ValueRuleValue<BlockType>;
    catchBlock: ValueRuleValue<CatchClauseType>[];
    finallyBlock: ValueRuleValue<FinallyBlockType | null>;
};

export const isTryStatementType = (value: unknown): value is TryStatementType => {
    return isCommonType(value) && value.type === 'tryStatement';
};

export const makeTryStatementAssignRule: AssignForValueRule<
    TryStatementTypeClass,
    TryStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isTryStatementTypeClass),
    construct: (statementTypeClass: TryStatementTypeClass) => {
        const block = assignMultiClass(statementTypeClass.getValue(), [
            makeBlockAssignRule,
            makeErrorAssignRule,
        ]);
        const catchBlock = statementTypeClass
            .getCatchBlock()
            .map((v) => assignMultiClass(v, [makeCatchClauseAssignRule, makeErrorAssignRule]));
        const finallyBlock = assignMultiClass(statementTypeClass.getFinallyBlock(), [
            makeFinallyBlockAssignRule,
            makeErrorAssignRule,
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

export type UndeleteStatementType = CommonType<'undeleteStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isUndeleteStatementType = (value: unknown): value is UndeleteStatementType => {
    return isCommonType(value) && value.type === 'undeleteStatement';
};

export const makeUndeleteStatementAssignRule: AssignForValueRule<
    UndeleteStatementTypeClass,
    UndeleteStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isUndeleteStatementTypeClass),
    construct: (statementTypeClass: UndeleteStatementTypeClass) => {
        const value = assignMultiClass(statementTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
            makeAccessLevelAssignRule,
            makeErrorAssignRule,
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

export type UpdateStatementType = CommonType<'updateStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isUpdateStatementType = (value: unknown): value is UpdateStatementType => {
    return isCommonType(value) && value.type === 'updateStatement';
};

export const makeUpdateStatementAssignRule: AssignForValueRule<
    UpdateStatementTypeClass,
    UpdateStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isUpdateStatementTypeClass),
    construct: (statementTypeClass: UpdateStatementTypeClass) => {
        const value = assignMultiClass(statementTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
            makeAccessLevelAssignRule,
            makeErrorAssignRule,
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

export type UpsertStatementType = CommonType<'upsertStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
    key: ValueRuleValue<QualifiedNameType | null>;
};

export const isUpsertStatementType = (value: unknown): value is UpsertStatementType => {
    return isCommonType(value) && value.type === 'upsertStatement';
};

export const makeUpsertStatementAssignRule: AssignForValueRule<
    UpsertStatementTypeClass,
    UpsertStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isUpsertStatementTypeClass),
    construct: (statementTypeClass: UpsertStatementTypeClass) => {
        const value = assignMultiClass(statementTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
            makeAccessLevelAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const key = assignMultiClass(statementTypeClass.getKey(), [
            makeQualifiedNameAssignRule,
            makeErrorAssignRule,
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

export type WhileStatementType = CommonType<'whileStatement'> & {
    value: ValueRuleValue<ParExpressionType>;
    block: ValueRuleValue<StatementType>;
};

export const isWhileStatementType = (value: unknown): value is WhileStatementType => {
    return isCommonType(value) && value.type === 'whileStatement';
};

export const makeWhileStatementAssignRule: AssignForValueRule<
    WhileStatementTypeClass,
    WhileStatementType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isWhileStatementTypeClass),
    construct: (statementTypeClass: WhileStatementTypeClass) => {
        const value = assignMultiClass(statementTypeClass.getValue(), [
            makeParExpressionAssignRule,
            makeErrorAssignRule,
        ]);
        const block = assignMultiClass(statementTypeClass.getBlock(), [
            makeStatementAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: statementTypeClass.getType(),
            sourceInfo: makeSourceInfo(statementTypeClass),
            value,
            block,
        };
    },
};

export type StatementType = CommonType<'statement'> & {
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

export const isStatementType = (value: unknown): value is StatementType => {
    return isCommonType(value) && value.type === 'statement';
};

export const makeStatementAssignRule: AssignForValueRule<NormalStatementTypeClass, StatementType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalStatementType),
        construct: (statementTypeClass: NormalStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeBlockAssignRule,
                makeIfStatementAssignRule,
                makeSwitchStatementAssignRule,
                makeForStatementAssignRule,
                makeWhileStatementAssignRule,
                makeDoWhileStatementAssignRule,
                makeTryStatementAssignRule,
                makeReturnStatementAssignRule,
                makeThrowStatementAssignRule,
                makeBreakStatementAssignRule,
                makeContinueStatementAssignRule,
                makeInsertStatementAssignRule,
                makeUpdateStatementAssignRule,
                makeDeleteStatementAssignRule,
                makeUndeleteStatementAssignRule,
                makeUpsertStatementAssignRule,
                makeMergeStatementAssignRule,
                makeRunAsStatementAssignRule,
                makeLocalVariableDeclarationStatementAssignRule,
                makeExpressionStatementAssignRule,
                makeErrorAssignRule,
            ]);
            return {
                type: statementTypeClass.getType(),
                sourceInfo: makeSourceInfo(statementTypeClass),
                value,
            };
        },
    };
