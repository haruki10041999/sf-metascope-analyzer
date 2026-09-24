import {
    ApexParserBaseVisitor,
    BlockContext,
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

import { BlockStatemtType, makeBlockStatemtType } from './block';
import { IfStatementType, makeIfStatementType } from './if';
import { SwitchStatementType, makeSwitchStatementType } from './switch';
import { ForStatementType, makeForStatementType } from './for';
import { WhileStatementType, makeWhileStatementType } from './while';
import { DoWhileStatementType, makeDoWhileStatementType } from './doWhile';
import { TryStatementType, makeTryStatementType } from './try';
import { ReturnStatementType, makeReturnStatementType } from './return';
import { ThrowStatementType, makeThrowStatementType } from './throw';
import { BreakStatementType, makeBreakStatementType } from './break';
import { ContinueStatementType, makeContinueStatementType } from './continue';
import { InsertStatementType, makeInsertStatementType } from './insert';
import { UpdateStatementType, makeUpdateStatementType } from './update';
import { DeleteStatementType, makeDeleteStatementType } from './delete';
import { UnDeleteStatementType, makeUnDeleteStatementType } from './undelete';
import { UpsertStatementType, makeUpsertStatementType } from './upsert';
import { MergeStatementType, makeMergeStatementType } from './merge';
import { RunAsStatementType, makeRunAsStatementType } from './runAs';
import { LocalVariantStatementType, makeLocalVariantStatementType } from './localVariant';
import { ExpressionStatementType, makeExpressionStatementType } from './expression';

export type StatementType =
    | BlockStatemtType
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
    | UnDeleteStatementType
    | UpsertStatementType
    | MergeStatementType
    | RunAsStatementType
    | LocalVariantStatementType
    | ExpressionStatementType;

export class StatementVisitor extends ApexParserBaseVisitor<StatementType> {
    visitBlockContext(ctx: BlockContext) {
        return makeBlockStatemtType(ctx);
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
        return makeUnDeleteStatementType(ctx);
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
        return makeLocalVariantStatementType(ctx);
    }

    visitExpressionStatementContext(ctx: ExpressionStatementContext) {
        return makeExpressionStatementType(ctx);
    }
}
