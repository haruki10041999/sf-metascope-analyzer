import {
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

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { StatementAllTypeClass } from './base';

import { NormalStatementTypeClass } from './normal';
import { IfStatementTypeClass } from './ifStatement';
import { SwitchStatementTypeClass } from './switchStatement';
import { ForStatementTypeClass } from './forStatement';
import { WhileStatementTypeClass } from './whileStatement';
import { DoWhileStatementTypeClass } from './doWhileStatement';
import { TryStatementTypeClass } from './tryStatement';
import { ReturnStatementTypeClass } from './returnStatement';
import { ThrowStatementTypeClass } from './throwStatement';
import { BreakStatementTypeClass } from './breakStatement';
import { ContinueStatementTypeClass } from './continueStatement';
import { InsertStatementTypeClass } from './insertStatement';
import { UpdateStatementTypeClass } from './updateStatement';
import { DeleteStatementTypeClass } from './deleteStatement';
import { UndeleteStatementTypeClass } from './undeleteStatement';
import { UpsertStatementTypeClass } from './upsertStatement';
import { MergeStatementTypeClass } from './mergeStatement';
import { RunAsStatementTypeClass } from './runAsStatement';
import { LocalVariableDeclarationStatementTypeClass } from './localVariableDeclarationStatement';
import { ExpressionStatementTypeClass } from './expressionStatement';
import { AccessLevelTypeClass } from './accessLevel';

import { CommonVisitor } from '../commonVisitor';

export { isNormalStatementType, NormalStatementTypeClass } from './normal';
export { isReturnStatementType, ReturnStatementTypeClass } from './returnStatement';
export { isRunAsStatementType, RunAsStatementTypeClass } from './runAsStatement';
export { isThrowStatementType, ThrowStatementTypeClass } from './throwStatement';
export { isBreakStatementType, BreakStatementTypeClass } from './breakStatement';
export { isContinueStatementType, ContinueStatementTypeClass } from './continueStatement';
export { isInsertStatementType, InsertStatementTypeClass } from './insertStatement';
export { isUpdateStatementType, UpdateStatementTypeClass } from './updateStatement';
export { isDeleteStatementType, DeleteStatementTypeClass } from './deleteStatement';
export { isUndeleteStatementType, UndeleteStatementTypeClass } from './undeleteStatement';
export { isUpsertStatementType, UpsertStatementTypeClass } from './upsertStatement';
export { isMergeStatementType, MergeStatementTypeClass } from './mergeStatement';
export { isIfStatementType, IfStatementTypeClass } from './ifStatement';
export { isSwitchStatementType, SwitchStatementTypeClass } from './switchStatement';
export { isForStatementType, ForStatementTypeClass } from './forStatement';
export { isWhileStatementType, WhileStatementTypeClass } from './whileStatement';
export { isDoWhileStatementType, DoWhileStatementTypeClass } from './doWhileStatement';
export { isTryStatementType, TryStatementTypeClass } from './tryStatement';
export {
    isLocalVariableDeclarationStatementType,
    LocalVariableDeclarationStatementTypeClass,
} from './localVariableDeclarationStatement';
export { isExpressionStatementType, ExpressionStatementTypeClass } from './expressionStatement';
export { isAccessLevelType, AccessLevelTypeClass } from './accessLevel';

export class StatementVisitor extends CommonVisitor<StatementAllTypeClass> {
    visitStatement(ctx: StatementContext) {
        return NormalStatementTypeClass.create(ctx);
    }

    visitIfStatement(ctx: IfStatementContext) {
        return IfStatementTypeClass.create(ctx);
    }

    visitSwitchStatement(ctx: SwitchStatementContext) {
        return SwitchStatementTypeClass.create(ctx);
    }

    visitForStatement(ctx: ForStatementContext) {
        return ForStatementTypeClass.create(ctx);
    }

    visitWhileStatement(ctx: WhileStatementContext) {
        return WhileStatementTypeClass.create(ctx);
    }

    visitDoWhileStatement(ctx: DoWhileStatementContext) {
        return DoWhileStatementTypeClass.create(ctx);
    }

    visitTryStatement(ctx: TryStatementContext) {
        return TryStatementTypeClass.create(ctx);
    }

    visitReturnStatement(ctx: ReturnStatementContext) {
        return ReturnStatementTypeClass.create(ctx);
    }

    visitThrowStatement(ctx: ThrowStatementContext) {
        return ThrowStatementTypeClass.create(ctx);
    }

    visitBreakStatement(ctx: BreakStatementContext) {
        return BreakStatementTypeClass.create(ctx);
    }

    visitContinueStatement(ctx: ContinueStatementContext) {
        return ContinueStatementTypeClass.create(ctx);
    }

    visitInsertStatement(ctx: InsertStatementContext) {
        return InsertStatementTypeClass.create(ctx);
    }

    visitUpdateStatement(ctx: UpdateStatementContext) {
        return UpdateStatementTypeClass.create(ctx);
    }

    visitDeleteStatement(ctx: DeleteStatementContext) {
        return DeleteStatementTypeClass.create(ctx);
    }

    visitUndeleteStatement(ctx: UndeleteStatementContext) {
        return UndeleteStatementTypeClass.create(ctx);
    }

    visitUpsertStatement(ctx: UpsertStatementContext) {
        return UpsertStatementTypeClass.create(ctx);
    }

    visitMergeStatement(ctx: MergeStatementContext) {
        return MergeStatementTypeClass.create(ctx);
    }

    visitRunAsStatement(ctx: RunAsStatementContext) {
        return RunAsStatementTypeClass.create(ctx);
    }

    visitLocalVariableDeclarationStatement(ctx: LocalVariableDeclarationStatementContext) {
        return LocalVariableDeclarationStatementTypeClass.create(ctx);
    }

    visitExpressionStatement(ctx: ExpressionStatementContext) {
        return ExpressionStatementTypeClass.create(ctx);
    }

    visitAccessLevel(ctx: AccessLevelContext) {
        return AccessLevelTypeClass.create(ctx);
    }
}

