import {
    ApexParserBaseVisitor,
    StatementContext,
    IfStatementContext,
    SwitchStatementContext,
    ForStatementContext,
    WhileStatementContext,
    DoWhileStatementContext,
    TryStatementContext,
    ReturnStatementContext,
    ThrowStatementContext,
    BreakStatementContext,
    ContinueStatementContext,
    InsertStatementContext,
    UpdateStatementContext,
    DeleteStatementContext,
    UndeleteStatementContext,
    UpsertStatementContext,
    MergeStatementContext,
    RunAsStatementContext,
    LocalVariableDeclarationStatementContext,
    ExpressionStatementContext,
    AccessLevelContext,
} from '@apexdevtools/apex-parser';

import { StatementType as statementType, makeStatementType } from './statement';
import { IfStatementType, makeIfStatementType } from './ifStatement';
import { SwitchStatementType, makeSwitchStatementType } from './switchStatement';
import { ForStatementType, makeForStatementType } from './forStatement';
import { WhileStatementType, makeWhileStatementType } from './whileStatement';
import { DoWhileStatementType, makeDoWhileStatementType } from './doWhileStatement';
import { TryStatementType, makeTryStatementType } from './tryStatement';
import { ReturnStatementType, makeReturnStatementType } from './returnStatement';
import { ThrowStatementType, makeThrowStatementType } from './throwStatement';
import { BreakStatementType, makeBreakStatementType } from './breakStatement';
import { ContinueStatementType, makeContinueStatementType } from './continueStatement';
import { InsertStatementType, makeInsertStatementType } from './insertStatement';
import { UpdateStatementType, makeUpdateStatementType } from './updateStatement';
import { DeleteStatementType, makeDeleteStatementType } from './deleteStatement';
import { UndeleteStatementType, makeUndeleteStatementType } from './undeleteStatement';
import { UpsertStatementType, makeUpsertStatementType } from './upsertStatement';
import { MergeStatementType, makeMergeStatementType } from './mergeStatement';
import { RunAsStatementType, makeRunAsStatementType } from './runAsStatement';
import {
    LocalVariableDeclarationStatementType,
    makeLocalVariableDeclarationStatementType,
} from './localVariableDeclarationStatement';
import { ExpressionStatementType, makeExpressionStatementType } from './expressionStatement';
import { AccessLevelType, makeAccessLevelType } from './accessLevel';

import { ErrorType, CommonVisitor } from '../commonVisitor';

export type StatementType =
    | statementType
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
    | AccessLevelType
    | ErrorType;

export class StatementVisitor extends CommonVisitor<StatementType> {
    visitStatement(ctx: StatementContext) {
        console.log('解析を開始します。' + 'StatementContext:  ' + ctx.getText());
        const result = makeStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'StatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitIfStatement(ctx: IfStatementContext) {
        console.log('解析を開始します。' + 'IfStatementContext:  ' + ctx.getText());
        const result = makeIfStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'IfStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSwitchStatement(ctx: SwitchStatementContext) {
        console.log('解析を開始します。' + 'SwitchStatementContext:  ' + ctx.getText());
        const result = makeSwitchStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SwitchStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitForStatement(ctx: ForStatementContext) {
        console.log('解析を開始します。' + 'ForStatementContext:  ' + ctx.getText());
        const result = makeForStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ForStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitWhileStatement(ctx: WhileStatementContext) {
        console.log('解析を開始します。' + 'WhileStatementContext:  ' + ctx.getText());
        const result = makeWhileStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'WhileStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitDoWhileStatement(ctx: DoWhileStatementContext) {
        console.log('解析を開始します。' + 'DoWhileStatementContext:  ' + ctx.getText());
        const result = makeDoWhileStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'DoWhileStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitTryStatement(ctx: TryStatementContext) {
        console.log('解析を開始します。' + 'TryStatementContext:  ' + ctx.getText());
        const result = makeTryStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TryStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitReturnStatement(ctx: ReturnStatementContext) {
        console.log('解析を開始します。' + 'ReturnStatementContext:  ' + ctx.getText());
        const result = makeReturnStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ReturnStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitThrowStatement(ctx: ThrowStatementContext) {
        console.log('解析を開始します。' + 'ThrowStatementContext:  ' + ctx.getText());
        const result = makeThrowStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ThrowStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitBreakStatement(ctx: BreakStatementContext) {
        console.log('解析を開始します。' + 'BreakStatementContext:  ' + ctx.getText());
        const result = makeBreakStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'BreakStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitContinueStatement(ctx: ContinueStatementContext) {
        console.log('解析を開始します。' + 'ContinueStatementContext:  ' + ctx.getText());
        const result = makeContinueStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ContinueStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitInsertStatement(ctx: InsertStatementContext) {
        console.log('解析を開始します。' + 'InsertStatementContext:  ' + ctx.getText());
        const result = makeInsertStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'InsertStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitUpdateStatement(ctx: UpdateStatementContext) {
        console.log('解析を開始します。' + 'UpdateStatementContext:  ' + ctx.getText());
        const result = makeUpdateStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'UpdateStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitDeleteStatement(ctx: DeleteStatementContext) {
        console.log('解析を開始します。' + 'DeleteStatementContext:  ' + ctx.getText());
        const result = makeDeleteStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'DeleteStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitUndeleteStatement(ctx: UndeleteStatementContext) {
        console.log('解析を開始します。' + 'UndeleteStatementContext:  ' + ctx.getText());
        const result = makeUndeleteStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'UndeleteStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitUpsertStatement(ctx: UpsertStatementContext) {
        console.log('解析を開始します。' + 'UpsertStatementContext:  ' + ctx.getText());
        const result = makeUpsertStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'UpsertStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitMergeStatement(ctx: MergeStatementContext) {
        console.log('解析を開始します。' + 'MergeStatementContext:  ' + ctx.getText());
        const result = makeMergeStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'MergeStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitRunAsStatement(ctx: RunAsStatementContext) {
        console.log('解析を開始します。' + 'RunAsStatementContext:  ' + ctx.getText());
        const result = makeRunAsStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'RunAsStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitLocalVariableDeclarationStatement(ctx: LocalVariableDeclarationStatementContext) {
        console.log(
            '解析を開始します。' + 'LocalVariableDeclarationStatementContext:  ' + ctx.getText(),
        );
        const result = makeLocalVariableDeclarationStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'LocalVariableDeclarationStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitExpressionStatement(ctx: ExpressionStatementContext) {
        console.log('解析を開始します。' + 'ExpressionStatementContext:  ' + ctx.getText());
        const result = makeExpressionStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ExpressionStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitAccessLevel(ctx: AccessLevelContext) {
        console.log('解析を開始します。' + 'AccessLevelContext:  ' + ctx.getText());
        const result = makeAccessLevelType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'AccessLevelContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}

