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
    SourceSlot,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceNode,
    makeSourceGroup,
    sourceField,
    sourceList,
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

export type AccessLevelType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isAccessLevelType = typia.createIs<AccessLevelType>();

export const makeAccessLevelRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<AccessLevelTypeClass, AccessLevelType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAccessLevelTypeClass),
        construct: (statementTypeClass: AccessLevelTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(makeSourceNode(statementTypeClass));
            return { type: statementTypeClass.getType(), value };
        },
    };
};

export type BreakStatementType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isBreakStatementType = typia.createIs<BreakStatementType>();

export const makeBreakStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<BreakStatementTypeClass, BreakStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBreakStatementTypeClass),
        construct: (statementTypeClass: BreakStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(makeSourceNode(statementTypeClass));
            return { type: statementTypeClass.getType(), value };
        },
    };
};

export type ContinueStatementType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isContinueStatementType = typia.createIs<ContinueStatementType>();

export const makeContinueStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ContinueStatementTypeClass, ContinueStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isContinueStatementTypeClass),
        construct: (statementTypeClass: ContinueStatementTypeClass) => {
            const value = assignMultiClass(statementTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(makeSourceNode(statementTypeClass));
            return { type: statementTypeClass.getType(), value };
        },
    };
};

export type DeleteStatementType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType>;
};

export const isDeleteStatementType = typia.createIs<DeleteStatementType>();

export const makeDeleteStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DeleteStatementTypeClass, DeleteStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDeleteStatementTypeClass),
        construct: (statementTypeClass: DeleteStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(sourceField(node, 'accessLevel'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value, accessLevel };
        },
    };
};

export type DoWhileStatementType = {
    type: string;
    value: ValueRuleValue<ParExpressionType>;
    block: ValueRuleValue<BlockType>;
};

export const isDoWhileStatementType = typia.createIs<DoWhileStatementType>();

export const makeDoWhileStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DoWhileStatementTypeClass, DoWhileStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDoWhileStatementTypeClass),
        construct: (statementTypeClass: DoWhileStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeParExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const block = assignMultiClass(statementTypeClass.getBlock(), [
                makeBlockRule(sourceField(node, 'block'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value, block };
        },
    };
};

export type ExpressionStatementType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
};

export const isExpressionStatementType = typia.createIs<ExpressionStatementType>();

export const makeExpressionStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ExpressionStatementTypeClass, ExpressionStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isExpressionStatementTypeClass),
        construct: (statementTypeClass: ExpressionStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value };
        },
    };
};

export type ForStatementType = {
    type: string;
    value: ValueRuleValue<ForControlType>;
    block: ValueRuleValue<StatementType>;
};

export const isForStatementType = typia.createIs<ForStatementType>();

export const makeForStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ForStatementTypeClass, ForStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForStatementTypeClass),
        construct: (statementTypeClass: ForStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeForControlRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const block = assignMultiClass(statementTypeClass.getBlock(), [
                makeStatementRule(sourceField(node, 'block'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value, block };
        },
    };
};

export type IfStatementType = {
    type: string;
    value: ValueRuleValue<
        {
            condition: ValueRuleValue<ParExpressionType | string>;
            block: ValueRuleValue<StatementType>;
        }[]
    >;
};

export const isIfStatementType = typia.createIs<IfStatementType>();

export const makeIfStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<IfStatementTypeClass, IfStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isIfStatementTypeClass),
        construct: (statementTypeClass: IfStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            sourceField(node, 'value');
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
                        const branchSource = sourceList(node, 'value');
                        return values.map((v, index) => {
                            const group = makeSourceGroup();
                            const condition = assignMultiClass(v.value, [
                                {
                                    isValid: (target: unknown): target is string =>
                                        typeof target === 'string',
                                    construct: (value: string) => value,
                                },
                                makeParExpressionRule(sourceField(group, 'condition'), errorInfo),
                                makeErrorAssignRule(errorInfo),
                            ]);
                            const block = assignMultiClass(v.block, [
                                makeStatementRule(sourceField(group, 'block'), errorInfo),
                                makeErrorAssignRule(errorInfo),
                            ]);
                            branchSource(index)(group);
                            return { condition, block };
                        });
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value };
        },
    };
};

export type InsertStatementType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType>;
};

export const isInsertStatementType = typia.createIs<InsertStatementType>();

export const makeInsertStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<InsertStatementTypeClass, InsertStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isInsertStatementTypeClass),
        construct: (statementTypeClass: InsertStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(sourceField(node, 'accessLevel'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value, accessLevel };
        },
    };
};

export type LocalVariableDeclarationStatementType = {
    type: string;
    value: ValueRuleValue<LocalVariableDeclarationType>;
};

export const isLocalVariableDeclarationStatementType =
    typia.createIs<LocalVariableDeclarationStatementType>();

export const makeLocalVariableDeclarationStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<
    LocalVariableDeclarationStatementTypeClass,
    LocalVariableDeclarationStatementType
> => {
    return {
        isValid: (target: unknown) =>
            isTargetTypeClass(target, isLocalVariableDeclarationStatementTypeClass),
        construct: (statementTypeClass: LocalVariableDeclarationStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeLocalVariableDeclarationRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value };
        },
    };
};

export type MergeStatementType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>[];
    accessLevel: ValueRuleValue<AccessLevelType>;
};

export const isMergeStatementType = typia.createIs<MergeStatementType>();

export const makeMergeStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<MergeStatementTypeClass, MergeStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMergeStatementTypeClass),
        construct: (statementTypeClass: MergeStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = statementTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        ...makeBaseExpressionRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(sourceField(node, 'accessLevel'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value, accessLevel };
        },
    };
};

export type ReturnStatementType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
};

export const isReturnStatementType = typia.createIs<ReturnStatementType>();

export const makeReturnStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ReturnStatementTypeClass, ReturnStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isReturnStatementTypeClass),
        construct: (statementTypeClass: ReturnStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value };
        },
    };
};

export type RunAsStatementType = {
    type: string;
    value: ValueRuleValue<ExpressionListType>;
    block: ValueRuleValue<BlockType>;
};

export const isRunAsStatementType = typia.createIs<RunAsStatementType>();

export const makeRunAsStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<RunAsStatementTypeClass, RunAsStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isRunAsStatementTypeClass),
        construct: (statementTypeClass: RunAsStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeExpressionListRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const block = assignMultiClass(statementTypeClass.getBlock(), [
                makeBlockRule(sourceField(node, 'block'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value, block };
        },
    };
};

export type SwitchStatementType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
    block: ValueRuleValue<WhenControlType>[];
};

export const isSwitchStatementType = typia.createIs<SwitchStatementType>();

export const makeSwitchStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SwitchStatementTypeClass, SwitchStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSwitchStatementTypeClass),
        construct: (statementTypeClass: SwitchStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const blockSource = sourceList(node, 'block');
            const block = statementTypeClass
                .getBlocks()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeWhenControlRule(blockSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );

            slot(node);
            return { type: statementTypeClass.getType(), value, block };
        },
    };
};

export type ThrowStatementType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
};

export const isThrowStatementType = typia.createIs<ThrowStatementType>();

export const makeThrowStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ThrowStatementTypeClass, ThrowStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isThrowStatementTypeClass),
        construct: (statementTypeClass: ThrowStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value };
        },
    };
};

export type TryStatementType = {
    type: string;
    block: ValueRuleValue<BlockType>;
    catchBlock: ValueRuleValue<CatchClauseType>[];
    finallyBlock: ValueRuleValue<FinallyBlockType>;
};

export const isTryStatementType = typia.createIs<TryStatementType>();

export const makeTryStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TryStatementTypeClass, TryStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTryStatementTypeClass),
        construct: (statementTypeClass: TryStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const block = assignMultiClass(statementTypeClass.getValue(), [
                makeBlockRule(sourceField(node, 'block'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const catchBlockSource = sourceList(node, 'catchBlock');
            const catchBlock = statementTypeClass
                .getCatchBlock()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeCatchClauseRule(catchBlockSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            const finallyBlock = assignMultiClass(statementTypeClass.getFinallyBlock(), [
                makeFinallyBlockRule(sourceField(node, 'finallyBlock'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), block, catchBlock, finallyBlock };
        },
    };
};

export type UndeleteStatementType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType>;
};

export const isUndeleteStatementType = typia.createIs<UndeleteStatementType>();

export const makeUndeleteStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<UndeleteStatementTypeClass, UndeleteStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUndeleteStatementTypeClass),
        construct: (statementTypeClass: UndeleteStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(sourceField(node, 'accessLevel'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value, accessLevel };
        },
    };
};

export type UpdateStatementType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType>;
};

export const isUpdateStatementType = typia.createIs<UpdateStatementType>();

export const makeUpdateStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<UpdateStatementTypeClass, UpdateStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUpdateStatementTypeClass),
        construct: (statementTypeClass: UpdateStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(sourceField(node, 'accessLevel'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value, accessLevel };
        },
    };
};

export type UpsertStatementType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType>;
    key: ValueRuleValue<QualifiedNameType>;
};

export const isUpsertStatementType = typia.createIs<UpsertStatementType>();

export const makeUpsertStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<UpsertStatementTypeClass, UpsertStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUpsertStatementTypeClass),
        construct: (statementTypeClass: UpsertStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const value = assignMultiClass(statementTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const accessLevel = assignMultiClass(statementTypeClass.getAccessLevel(), [
                makeAccessLevelRule(sourceField(node, 'accessLevel'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const key = assignMultiClass(statementTypeClass.getKey(), [
                makeQualifiedNameRule(sourceField(node, 'key'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value, accessLevel, key };
        },
    };
};

export type WhileStatementType = {
    type: string;
    value: ValueRuleValue<ParExpressionType>;
    block: ValueRuleValue<StatementType>;
};

export const isWhileStatementType = typia.createIs<WhileStatementType>();

export const makeWhileStatementRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhileStatementTypeClass, WhileStatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhileStatementTypeClass),
        construct: (statementTypeClass: WhileStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeParExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const block = assignMultiClass(statementTypeClass.getBlock(), [
                makeStatementRule(sourceField(node, 'block'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value, block };
        },
    };
};

export type StatementType = {
    type: string;
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
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalStatementTypeClass, StatementType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalStatementType),
        construct: (statementTypeClass: NormalStatementTypeClass) => {
            const node = makeSourceNode(statementTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(statementTypeClass.getValue(), [
                makeBlockRule(valueSource, errorInfo),
                makeIfStatementRule(valueSource, errorInfo),
                makeSwitchStatementRule(valueSource, errorInfo),
                makeForStatementRule(valueSource, errorInfo),
                makeWhileStatementRule(valueSource, errorInfo),
                makeDoWhileStatementRule(valueSource, errorInfo),
                makeTryStatementRule(valueSource, errorInfo),
                makeReturnStatementRule(valueSource, errorInfo),
                makeThrowStatementRule(valueSource, errorInfo),
                makeBreakStatementRule(valueSource, errorInfo),
                makeContinueStatementRule(valueSource, errorInfo),
                makeInsertStatementRule(valueSource, errorInfo),
                makeUpdateStatementRule(valueSource, errorInfo),
                makeDeleteStatementRule(valueSource, errorInfo),
                makeUndeleteStatementRule(valueSource, errorInfo),
                makeUpsertStatementRule(valueSource, errorInfo),
                makeMergeStatementRule(valueSource, errorInfo),
                makeRunAsStatementRule(valueSource, errorInfo),
                makeLocalVariableDeclarationStatementRule(valueSource, errorInfo),
                makeExpressionStatementRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: statementTypeClass.getType(), value };
        },
    };
};

