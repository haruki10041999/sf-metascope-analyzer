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
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

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

export class NormalStatementTypeClass extends StatementTypeClass<NormalStatementTypeClassType> {
    private constructor(value: NormalStatementTypeClassType | ErrorTypeClass) {
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

        let value: NormalStatementTypeClassType | ErrorTypeClass;

        if (ctx.block()) {
            value = isValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block');
        } else if (ctx.ifStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.ifStatement()),
                isIfStatementType,
                'ifStatement',
            );
        } else if (ctx.switchStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.switchStatement()),
                isSwitchStatementType,
                'switchStatement',
            );
        } else if (ctx.forStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.forStatement()),
                isForStatementType,
                'forStatement',
            );
        } else if (ctx.whileStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.whileStatement()),
                isWhileStatementType,
                'whileStatement',
            );
        } else if (ctx.doWhileStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.doWhileStatement()),
                isDoWhileStatementType,
                'doWhileStatement',
            );
        } else if (ctx.tryStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.tryStatement()),
                isTryStatementType,
                'tryStatement',
            );
        } else if (ctx.returnStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.returnStatement()),
                isReturnStatementType,
                'returnStatement',
            );
        } else if (ctx.throwStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.throwStatement()),
                isThrowStatementType,
                'throwStatement',
            );
        } else if (ctx.breakStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.breakStatement()),
                isBreakStatementType,
                'breakStatement',
            );
        } else if (ctx.continueStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.continueStatement()),
                isContinueStatementType,
                'continueStatement',
            );
        } else if (ctx.insertStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.insertStatement()),
                isInsertStatementType,
                'insertStatement',
            );
        } else if (ctx.updateStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.updateStatement()),
                isUpdateStatementType,
                'updateStatement',
            );
        } else if (ctx.deleteStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.deleteStatement()),
                isDeleteStatementType,
                'deleteStatement',
            );
        } else if (ctx.undeleteStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.undeleteStatement()),
                isUndeleteStatementType,
                'undeleteStatement',
            );
        } else if (ctx.upsertStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.upsertStatement()),
                isUpsertStatementType,
                'upsertStatement',
            );
        } else if (ctx.mergeStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.mergeStatement()),
                isMergeStatementType,
                'mergeStatement',
            );
        } else if (ctx.runAsStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.runAsStatement()),
                isRunAsStatementType,
                'runAsStatement',
            );
        } else if (ctx.localVariableDeclarationStatement()) {
            value = isValidClass(
                new StatementVisitor().visit(ctx.localVariableDeclarationStatement()),
                isLocalVariableDeclarationStatementType,
                'localVariableDeclarationStatement',
            );
        } else {
            value = isValidClass(
                new StatementVisitor().visit(ctx.expressionStatement()),
                isExpressionStatementType,
                'expressionStatement',
            );
        }

        return new NormalStatementTypeClass(value);
    }
}

export const isNormalStatementType = (
    target: CommonTypeClass,
): target is NormalStatementTypeClass => {
    return target instanceof NormalStatementTypeClass;
};

