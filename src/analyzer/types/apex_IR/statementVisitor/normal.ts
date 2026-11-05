import { StatementContext } from '@apexdevtools/apex-parser';

import {
    IfStatementTypeClass,
    SwitchStatementTypeClass,
    ForStatementTypeClass,
    WhileStatementTypeClass,
    DoWhileStatementTypeClass,
    TryStatementTypeClass,
    ReturnStatementTypeClass,
    ThrowStatementTypeClass,
    BreakStatementTypeClass,
    ContinueStatementTypeClass,
    InsertStatementTypeClass,
    UpdateStatementTypeClass,
    DeleteStatementTypeClass,
    UndeleteStatementTypeClass,
    UpsertStatementTypeClass,
    MergeStatementTypeClass,
    RunAsStatementTypeClass,
    LocalVariableDeclarationStatementTypeClass,
    ExpressionStatementTypeClass,
    StatementTypeClass,
    StatementVisitor,
    isIfStatementType,
    isSwitchStatementType,
    isForStatementType,
    isWhileStatementType,
    isDoWhileStatementType,
    isTryStatementType,
    isReturnStatementType,
    isThrowStatementType,
    isBreakStatementType,
    isContinueStatementType,
    isInsertStatementType,
    isUpdateStatementType,
    isDeleteStatementType,
    isUndeleteStatementType,
    isUpsertStatementType,
    isMergeStatementType,
    isRunAsStatementType,
    isLocalVariableDeclarationStatementType,
    isExpressionStatementType,
} from '.';

import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

type NormalStatementTypeClassType =
    | NormalBlockTypeClass
    | IfStatementTypeClass
    | SwitchStatementTypeClass
    | ForStatementTypeClass
    | WhileStatementTypeClass
    | DoWhileStatementTypeClass
    | TryStatementTypeClass
    | ReturnStatementTypeClass
    | ThrowStatementTypeClass
    | BreakStatementTypeClass
    | ContinueStatementTypeClass
    | InsertStatementTypeClass
    | UpdateStatementTypeClass
    | DeleteStatementTypeClass
    | UndeleteStatementTypeClass
    | UpsertStatementTypeClass
    | MergeStatementTypeClass
    | RunAsStatementTypeClass
    | LocalVariableDeclarationStatementTypeClass
    | ExpressionStatementTypeClass;

export class NormalStatementTypeClass extends StatementTypeClass<
    'statement',
    NormalStatementTypeClassType
> {
    private constructor(value: NormalStatementTypeClassType | ApexErrorTypeClass) {
        super('statement', value);
    }

    static create(ctx: StatementContext): NormalStatementTypeClass {
        if (
            !ctx.block() &&
            !ctx.ifStatement() &&
            !ctx.switchStatement() &&
            !ctx.forStatement() &&
            !ctx.whileStatement() &&
            !ctx.doWhileStatement() &&
            !ctx.tryStatement() &&
            !ctx.returnStatement() &&
            !ctx.throwStatement() &&
            !ctx.breakStatement() &&
            !ctx.continueStatement() &&
            !ctx.insertStatement() &&
            !ctx.updateStatement() &&
            !ctx.deleteStatement() &&
            !ctx.undeleteStatement() &&
            !ctx.upsertStatement() &&
            !ctx.mergeStatement() &&
            !ctx.runAsStatement() &&
            !ctx.localVariableDeclarationStatement() &&
            !ctx.expressionStatement()
        ) {
            throw new Error('値が異常です。StatementContext: ' + ctx.getText());
        }

        let value: NormalStatementTypeClassType | ApexErrorTypeClass;

        if (ctx.block()) {
            value = visitNode(new BlockVisitor(), ctx.block(), isNormalBlockType, 'block');
        } else if (ctx.ifStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.ifStatement(),
                isIfStatementType,
                'ifStatement',
            );
        } else if (ctx.switchStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.switchStatement(),
                isSwitchStatementType,
                'switchStatement',
            );
        } else if (ctx.forStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.forStatement(),
                isForStatementType,
                'forStatement',
            );
        } else if (ctx.whileStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.whileStatement(),
                isWhileStatementType,
                'whileStatement',
            );
        } else if (ctx.doWhileStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.doWhileStatement(),
                isDoWhileStatementType,
                'doWhileStatement',
            );
        } else if (ctx.tryStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.tryStatement(),
                isTryStatementType,
                'tryStatement',
            );
        } else if (ctx.returnStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.returnStatement(),
                isReturnStatementType,
                'returnStatement',
            );
        } else if (ctx.throwStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.throwStatement(),
                isThrowStatementType,
                'throwStatement',
            );
        } else if (ctx.breakStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.breakStatement(),
                isBreakStatementType,
                'breakStatement',
            );
        } else if (ctx.continueStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.continueStatement(),
                isContinueStatementType,
                'continueStatement',
            );
        } else if (ctx.insertStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.insertStatement(),
                isInsertStatementType,
                'insertStatement',
            );
        } else if (ctx.updateStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.updateStatement(),
                isUpdateStatementType,
                'updateStatement',
            );
        } else if (ctx.deleteStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.deleteStatement(),
                isDeleteStatementType,
                'deleteStatement',
            );
        } else if (ctx.undeleteStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.undeleteStatement(),
                isUndeleteStatementType,
                'undeleteStatement',
            );
        } else if (ctx.upsertStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.upsertStatement(),
                isUpsertStatementType,
                'upsertStatement',
            );
        } else if (ctx.mergeStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.mergeStatement(),
                isMergeStatementType,
                'mergeStatement',
            );
        } else if (ctx.runAsStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.runAsStatement(),
                isRunAsStatementType,
                'runAsStatement',
            );
        } else if (ctx.localVariableDeclarationStatement()) {
            value = visitNode(
                new StatementVisitor(),
                ctx.localVariableDeclarationStatement(),
                isLocalVariableDeclarationStatementType,
                'localVariableDeclarationStatement',
            );
        } else {
            value = visitNode(
                new StatementVisitor(),
                ctx.expressionStatement(),
                isExpressionStatementType,
                'expressionStatement',
            );
        }

        return new NormalStatementTypeClass(value);
    }
}

export const isNormalStatementType = (
    target: ApexCommonTypeClass<string>,
): target is NormalStatementTypeClass => {
    return target instanceof NormalStatementTypeClass;
};
