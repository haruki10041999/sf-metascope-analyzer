import { StatementContext } from '@apexdevtools/apex-parser';

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
import { DmlStatementType, makeDmlStatementType } from './dml';
import { RunAsStatementType, makeRunAsStatementType } from './runAs';
import { LocalVariantStatementType, makeLocalVariantStatementType } from './localVariant';
import { ExpressionStatementType, makeExpressionStatementType } from './expression';

export type StatementField =
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
    | DmlStatementType
    | RunAsStatementType
    | LocalVariantStatementType
    | ExpressionStatementType;

export const makeStatementField = (ctx: StatementContext): StatementField => {
    if (ctx.block()) {
        return makeBlockStatemtType(ctx.block());
    }

    if (ctx.ifStatement()) {
        return makeIfStatementType(ctx.ifStatement());
    }

    if (ctx.switchStatement()) {
        return makeSwitchStatementType(ctx.switchStatement());
    }

    if (ctx.forStatement()) {
        return makeForStatementType(ctx.forStatement());
    }

    if (ctx.whileStatement()) {
        return makeWhileStatementType(ctx.whileStatement());
    }

    if (ctx.doWhileStatement()) {
        return makeDoWhileStatementType(ctx.doWhileStatement());
    }

    if (ctx.tryStatement()) {
        return makeTryStatementType(ctx.tryStatement());
    }

    if (ctx.returnStatement()) {
        return makeReturnStatementType(ctx.returnStatement());
    }

    if (ctx.throwStatement()) {
        return makeThrowStatementType(ctx.throwStatement());
    }

    if (ctx.breakStatement()) {
        return makeBreakStatementType(ctx.breakStatement());
    }

    if (ctx.continueStatement()) {
        return makeContinueStatementType(ctx.continueStatement());
    }

    if (ctx.insertStatement()) {
        return makeDmlStatementType(ctx.insertStatement());
    }

    if (ctx.updateStatement()) {
        return makeDmlStatementType(ctx.updateStatement());
    }

    if (ctx.deleteStatement()) {
        return makeDmlStatementType(ctx.deleteStatement());
    }

    if (ctx.undeleteStatement()) {
        return makeDmlStatementType(ctx.undeleteStatement());
    }

    if (ctx.upsertStatement()) {
        return makeDmlStatementType(ctx.upsertStatement());
    }

    if (ctx.mergeStatement()) {
        return makeDmlStatementType(ctx.mergeStatement());
    }

    if (ctx.runAsStatement()) {
        return makeRunAsStatementType(ctx.runAsStatement());
    }

    if (ctx.localVariableDeclarationStatement()) {
        return makeLocalVariantStatementType(ctx.localVariableDeclarationStatement());
    }

    if (ctx.expressionStatement()) {
        return makeExpressionStatementType(ctx.expressionStatement());
    }

    throw new Error(`値が異常です: ${ctx.getText()}`);
};
