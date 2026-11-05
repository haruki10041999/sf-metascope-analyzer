import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { ForControlType, WhenControlType } from './control';
import { LocalVariableDeclarationType } from './declaration';
import { BaseExpressionType, ParExpressionType } from './expression';
import { ExpressionListType } from './list';
import { QualifiedNameType } from './name';
import { BlockType, FinallyBlockType } from './block';
import { CatchClauseType } from './clause';

export type AccessLevelType = CommonType<'accessLevel'> & {
    value: 'SYSTEM' | 'USER';
};

export const isAccessLevelType = (value: unknown): value is AccessLevelType => {
    return isCommonType(value) && value.type === 'accessLevel';
};

export type BreakStatementType = CommonType<'breakStatement'> & {
    value: string;
};

export const isBreakStatementType = (value: unknown): value is BreakStatementType => {
    return isCommonType(value) && value.type === 'breakStatement';
};

export type ContinueStatementType = CommonType<'continueStatement'> & {
    value: string;
};

export const isContinueStatementType = (value: unknown): value is ContinueStatementType => {
    return isCommonType(value) && value.type === 'continueStatement';
};

export type DeleteStatementType = CommonType<'deleteStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isDeleteStatementType = (value: unknown): value is DeleteStatementType => {
    return isCommonType(value) && value.type === 'deleteStatement';
};

export type DoWhileStatementType = CommonType<'doWhileStatement'> & {
    value: ValueRuleValue<ParExpressionType>;
    block: ValueRuleValue<BlockType>;
};

export const isDoWhileStatementType = (value: unknown): value is DoWhileStatementType => {
    return isCommonType(value) && value.type === 'doWhileStatement';
};

export type ExpressionStatementType = CommonType<'expressionStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isExpressionStatementType = (value: unknown): value is ExpressionStatementType => {
    return isCommonType(value) && value.type === 'expressionStatement';
};

export type ForStatementType = CommonType<'forStatement'> & {
    value: ValueRuleValue<ForControlType>;
    block: ValueRuleValue<StatementType>;
};

export const isForStatementType = (value: unknown): value is ForStatementType => {
    return isCommonType(value) && value.type === 'forStatement';
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

export type InsertStatementType = CommonType<'insertStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isInsertStatementType = (value: unknown): value is InsertStatementType => {
    return isCommonType(value) && value.type === 'insertStatement';
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

export type MergeStatementType = CommonType<'mergeStatement'> & {
    value: ValueRuleValue<BaseExpressionType>[];
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isMergeStatementType = (value: unknown): value is MergeStatementType => {
    return isCommonType(value) && value.type === 'mergeStatement';
};

export type ReturnStatementType = CommonType<'returnStatement'> & {
    value: ValueRuleValue<BaseExpressionType | null>;
};

export const isReturnStatementType = (value: unknown): value is ReturnStatementType => {
    return isCommonType(value) && value.type === 'returnStatement';
};

export type RunAsStatementType = CommonType<'runAsStatement'> & {
    value: ValueRuleValue<ExpressionListType>;
    block: ValueRuleValue<BlockType>;
};

export const isRunAsStatementType = (value: unknown): value is RunAsStatementType => {
    return isCommonType(value) && value.type === 'runAsStatement';
};

export type SwitchStatementType = CommonType<'switchStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    block: ValueRuleValue<WhenControlType>[];
};

export const isSwitchStatementType = (value: unknown): value is SwitchStatementType => {
    return isCommonType(value) && value.type === 'switchStatement';
};

export type ThrowStatementType = CommonType<'throwStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isThrowStatementType = (value: unknown): value is ThrowStatementType => {
    return isCommonType(value) && value.type === 'throwStatement';
};

export type TryStatementType = CommonType<'tryStatement'> & {
    block: ValueRuleValue<BlockType>;
    catchBlock: ValueRuleValue<CatchClauseType>[];
    finallyBlock: ValueRuleValue<FinallyBlockType | null>;
};

export const isTryStatementType = (value: unknown): value is TryStatementType => {
    return isCommonType(value) && value.type === 'tryStatement';
};

export type UndeleteStatementType = CommonType<'undeleteStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isUndeleteStatementType = (value: unknown): value is UndeleteStatementType => {
    return isCommonType(value) && value.type === 'undeleteStatement';
};

export type UpdateStatementType = CommonType<'updateStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
};

export const isUpdateStatementType = (value: unknown): value is UpdateStatementType => {
    return isCommonType(value) && value.type === 'updateStatement';
};

export type UpsertStatementType = CommonType<'upsertStatement'> & {
    value: ValueRuleValue<BaseExpressionType>;
    accessLevel: ValueRuleValue<AccessLevelType | null>;
    key: ValueRuleValue<QualifiedNameType | null>;
};

export const isUpsertStatementType = (value: unknown): value is UpsertStatementType => {
    return isCommonType(value) && value.type === 'upsertStatement';
};

export type WhileStatementType = CommonType<'whileStatement'> & {
    value: ValueRuleValue<ParExpressionType>;
    block: ValueRuleValue<StatementType>;
};

export const isWhileStatementType = (value: unknown): value is WhileStatementType => {
    return isCommonType(value) && value.type === 'whileStatement';
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
