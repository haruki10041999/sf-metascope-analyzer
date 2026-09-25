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
    | ExpressionStatementType;

export class StatementVisitor extends ApexParserBaseVisitor<StatementType> {
    visitStatementContext(ctx: StatementContext) {
        return makeStatementType(ctx);
    }

    visitIfStatementContext(ctx: IfStatementContext) {
        return makeIfStatementType(ctx);
    }

    visitSwitchStatementContext(ctx: SwitchStatementContext) {
        return makeSwitchStatementType(ctx);
    }

    visitForStatementContext(ctx: ForStatementContext) {
        return makeForStatementType(ctx);
    }

    visitWhileStatementContext(ctx: WhileStatementContext) {
        return makeWhileStatementType(ctx);
    }

    visitDoWhileStatementContext(ctx: DoWhileStatementContext) {
        return makeDoWhileStatementType(ctx);
    }

    visitTryStatementContext(ctx: TryStatementContext) {
        return makeTryStatementType(ctx);
    }

    visitReturnStatementContext(ctx: ReturnStatementContext) {
        return makeReturnStatementType(ctx);
    }

    visitThrowStatementContext(ctx: ThrowStatementContext) {
        return makeThrowStatementType(ctx);
    }

    visitBreakStatementContext(ctx: BreakStatementContext) {
        return makeBreakStatementType(ctx);
    }

    visitContinueStatementContext(ctx: ContinueStatementContext) {
        return makeContinueStatementType(ctx);
    }

    visitInsertStatementContext(ctx: InsertStatementContext) {
        return makeInsertStatementType(ctx);
    }

    visitUpdateStatementContext(ctx: UpdateStatementContext) {
        return makeUpdateStatementType(ctx);
    }

    visitDeleteStatementContext(ctx: DeleteStatementContext) {
        return makeDeleteStatementType(ctx);
    }

    visitUndeleteStatementContext(ctx: UndeleteStatementContext) {
        return makeUndeleteStatementType(ctx);
    }

    visitUpsertStatementContext(ctx: UpsertStatementContext) {
        return makeUpsertStatementType(ctx);
    }

    visitMergeStatementContext(ctx: MergeStatementContext) {
        return makeMergeStatementType(ctx);
    }

    visitRunAsStatementContext(ctx: RunAsStatementContext) {
        return makeRunAsStatementType(ctx);
    }

    visitLocalVariableDeclarationStatementContext(ctx: LocalVariableDeclarationStatementContext) {
        return makeLocalVariableDeclarationStatementType(ctx);
    }

    visitExpressionStatementContext(ctx: ExpressionStatementContext) {
        return makeExpressionStatementType(ctx);
    }
}

