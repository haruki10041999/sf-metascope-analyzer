import { StatementContext } from '@apexdevtools/apex-parser';

import { StatementType as statementType, StatementVisitor } from '.';
import { BlockType, BlockVisitor } from '../blockVisitor';

export type StatementType = {
    type: 'statement';
    block?: Omit<BlockType, 'type'>;
    ifStatement?: Omit<statementType, 'type'>;
    switchStatement?: Omit<statementType, 'type'>;
    forStatement?: Omit<statementType, 'type'>;
    whileStatement?: Omit<statementType, 'type'>;
    doWhileStatement?: Omit<statementType, 'type'>;
    tryStatement?: Omit<statementType, 'type'>;
    returnStatement?: Omit<statementType, 'type'>;
    throwStatement?: Omit<statementType, 'type'>;
    breakStatement?: Omit<statementType, 'type'>;
    continueStatement?: Omit<statementType, 'type'>;
    insertStatement?: Omit<statementType, 'type'>;
    updateStatement?: Omit<statementType, 'type'>;
    deleteStatement?: Omit<statementType, 'type'>;
    undeleteStatement?: Omit<statementType, 'type'>;
    upsertStatement?: Omit<statementType, 'type'>;
    mergeStatement?: Omit<statementType, 'type'>;
    runAsStatement?: Omit<statementType, 'type'>;
    localVariableDeclarationStatement?: Omit<statementType, 'type'>;
    expressionStatement?: Omit<statementType, 'type'>;
};

export const makeStatementType = (ctx: StatementContext): StatementType => {
    if (ctx.block()) {
        const { type, ...block } = new BlockVisitor().visit(ctx.block());
        return {
            type: 'statement',
            block: block,
        };
    }

    if (ctx.ifStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.ifStatement());
        return {
            type: 'statement',
            ifStatement: statement,
        };
    }

    if (ctx.switchStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.switchStatement());
        return {
            type: 'statement',
            switchStatement: statement,
        };
    }

    if (ctx.forStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.forStatement());
        return {
            type: 'statement',
            forStatement: statement,
        };
    }

    if (ctx.whileStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.whileStatement());
        return {
            type: 'statement',
            whileStatement: statement,
        };
    }

    if (ctx.doWhileStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.doWhileStatement());
        return {
            type: 'statement',
            doWhileStatement: statement,
        };
    }

    if (ctx.tryStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.tryStatement());
        return {
            type: 'statement',
            tryStatement: statement,
        };
    }

    if (ctx.returnStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.returnStatement());
        return {
            type: 'statement',
            returnStatement: statement,
        };
    }

    if (ctx.throwStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.throwStatement());
        return {
            type: 'statement',
            throwStatement: statement,
        };
    }

    if (ctx.breakStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.breakStatement());
        return {
            type: 'statement',
            breakStatement: statement,
        };
    }

    if (ctx.continueStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.continueStatement());
        return {
            type: 'statement',
            continueStatement: statement,
        };
    }

    if (ctx.insertStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.insertStatement());
        return {
            type: 'statement',
            insertStatement: statement,
        };
    }

    if (ctx.updateStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.updateStatement());
        return {
            type: 'statement',
            updateStatement: statement,
        };
    }

    if (ctx.deleteStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.deleteStatement());
        return {
            type: 'statement',
            deleteStatement: statement,
        };
    }

    if (ctx.undeleteStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.undeleteStatement());
        return {
            type: 'statement',
            undeleteStatement: statement,
        };
    }

    if (ctx.upsertStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.upsertStatement());
        return {
            type: 'statement',
            upsertStatement: statement,
        };
    }

    if (ctx.mergeStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.mergeStatement());
        return {
            type: 'statement',
            mergeStatement: statement,
        };
    }

    if (ctx.runAsStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.runAsStatement());
        return {
            type: 'statement',
            runAsStatement: statement,
        };
    }

    if (ctx.localVariableDeclarationStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(
            ctx.localVariableDeclarationStatement(),
        );
        return {
            type: 'statement',
            localVariableDeclarationStatement: statement,
        };
    }

    if (ctx.expressionStatement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.expressionStatement());
        return {
            type: 'statement',
            expressionStatement: statement,
        };
    }

    throw new Error('値が異常です。StatementContext: ' + ctx.getText());
};
