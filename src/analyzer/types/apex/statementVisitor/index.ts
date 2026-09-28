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
    | AccessLevelType;

export class StatementVisitor extends ApexParserBaseVisitor<StatementType> {
    visitStatement(ctx: StatementContext) {
        return makeStatementType(ctx);
    }

    visitIfStatement(ctx: IfStatementContext) {
        return makeIfStatementType(ctx);
    }

    visitSwitchStatement(ctx: SwitchStatementContext) {
        return makeSwitchStatementType(ctx);
    }

    visitForStatement(ctx: ForStatementContext) {
        return makeForStatementType(ctx);
    }

    visitWhileStatement(ctx: WhileStatementContext) {
        return makeWhileStatementType(ctx);
    }

    visitDoWhileStatement(ctx: DoWhileStatementContext) {
        return makeDoWhileStatementType(ctx);
    }

    visitTryStatement(ctx: TryStatementContext) {
        return makeTryStatementType(ctx);
    }

    visitReturnStatement(ctx: ReturnStatementContext) {
        return makeReturnStatementType(ctx);
    }

    visitThrowStatement(ctx: ThrowStatementContext) {
        return makeThrowStatementType(ctx);
    }

    visitBreakStatement(ctx: BreakStatementContext) {
        return makeBreakStatementType(ctx);
    }

    visitContinueStatement(ctx: ContinueStatementContext) {
        return makeContinueStatementType(ctx);
    }

    visitInsertStatement(ctx: InsertStatementContext) {
        return makeInsertStatementType(ctx);
    }

    visitUpdateStatement(ctx: UpdateStatementContext) {
        return makeUpdateStatementType(ctx);
    }

    visitDeleteStatement(ctx: DeleteStatementContext) {
        return makeDeleteStatementType(ctx);
    }

    visitUndeleteStatement(ctx: UndeleteStatementContext) {
        return makeUndeleteStatementType(ctx);
    }

    visitUpsertStatement(ctx: UpsertStatementContext) {
        return makeUpsertStatementType(ctx);
    }

    visitMergeStatement(ctx: MergeStatementContext) {
        return makeMergeStatementType(ctx);
    }

    visitRunAsStatement(ctx: RunAsStatementContext) {
        return makeRunAsStatementType(ctx);
    }

    visitLocalVariableDeclarationStatement(ctx: LocalVariableDeclarationStatementContext) {
        return makeLocalVariableDeclarationStatementType(ctx);
    }

    visitExpressionStatement(ctx: ExpressionStatementContext) {
        return makeExpressionStatementType(ctx);
    }

    visitAccessLevel(ctx: AccessLevelContext) {
        return makeAccessLevelType(ctx);
    }
}

