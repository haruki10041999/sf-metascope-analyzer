import { StatementContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from './statementVisitor';

export const makeStatementField = (ctx: StatementContext): StatementType => {
    if (ctx.block()) {
        return new StatementVisitor().visit(ctx.block());
    }

    if (ctx.ifStatement()) {
        return new StatementVisitor().visit(ctx.ifStatement());
    }

    if (ctx.switchStatement()) {
        return new StatementVisitor().visit(ctx.switchStatement());
    }

    if (ctx.forStatement()) {
        return new StatementVisitor().visit(ctx.forStatement());
    }

    if (ctx.whileStatement()) {
        return new StatementVisitor().visit(ctx.whileStatement());
    }

    if (ctx.doWhileStatement()) {
        return new StatementVisitor().visit(ctx.doWhileStatement());
    }

    if (ctx.tryStatement()) {
        return new StatementVisitor().visit(ctx.tryStatement());
    }

    if (ctx.returnStatement()) {
        return new StatementVisitor().visit(ctx.returnStatement());
    }

    if (ctx.throwStatement()) {
        return new StatementVisitor().visit(ctx.throwStatement());
    }

    if (ctx.breakStatement()) {
        return new StatementVisitor().visit(ctx.breakStatement());
    }

    if (ctx.continueStatement()) {
        return new StatementVisitor().visit(ctx.continueStatement());
    }

    if (ctx.insertStatement()) {
        return new StatementVisitor().visit(ctx.insertStatement());
    }

    if (ctx.updateStatement()) {
        return new StatementVisitor().visit(ctx.updateStatement());
    }

    if (ctx.deleteStatement()) {
        return new StatementVisitor().visit(ctx.deleteStatement());
    }

    if (ctx.undeleteStatement()) {
        return new StatementVisitor().visit(ctx.undeleteStatement());
    }

    if (ctx.upsertStatement()) {
        return new StatementVisitor().visit(ctx.upsertStatement());
    }

    if (ctx.mergeStatement()) {
        return new StatementVisitor().visit(ctx.mergeStatement());
    }

    if (ctx.runAsStatement()) {
        return new StatementVisitor().visit(ctx.runAsStatement());
    }

    if (ctx.localVariableDeclarationStatement()) {
        return new StatementVisitor().visit(ctx.localVariableDeclarationStatement());
    }

    if (ctx.expressionStatement()) {
        return new StatementVisitor().visit(ctx.expressionStatement());
    }

    throw new Error(`値が異常です: ${ctx.getText()}`);
};
