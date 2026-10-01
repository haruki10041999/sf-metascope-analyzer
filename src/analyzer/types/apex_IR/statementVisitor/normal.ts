import { StatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass, StatementVisitor, isStatementTypeAll } from '.';

import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class NormalStatementTypeClass extends StatementTypeClass<
    StatementTypeClass<unknown> | NormalBlockTypeClass
> {
    private constructor(
        value: StatementTypeClass<unknown> | NormalBlockTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('statement', value, errorClasses);
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
            !ctx.deleteStatement()
        ) {
            throw new Error('値が異常です。StatementContext: ' + ctx.getText());
        }
        return new NormalStatementTypeClass(
            makeStatementType(ctx) as StatementTypeClass<unknown>,
            {},
        );
    }
}

export const isNormalStatementType = (
    target: CommonTypeClass,
): target is NormalStatementTypeClass => {
    return target instanceof NormalStatementTypeClass;
};

export const makeStatementType = (ctx: StatementContext): StatementType => {
    if (ctx.block()) {
        const block = new BlockVisitor().visit(ctx.block());
        return {
            type: 'statement',
            statement: block,
        };
    }

    if (ctx.ifStatement()) {
        const statement = new StatementVisitor().visit(ctx.ifStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.switchStatement()) {
        const statement = new StatementVisitor().visit(ctx.switchStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.forStatement()) {
        const statement = new StatementVisitor().visit(ctx.forStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.whileStatement()) {
        const statement = new StatementVisitor().visit(ctx.whileStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.doWhileStatement()) {
        const statement = new StatementVisitor().visit(ctx.doWhileStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.tryStatement()) {
        const statement = new StatementVisitor().visit(ctx.tryStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.returnStatement()) {
        const statement = new StatementVisitor().visit(ctx.returnStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.throwStatement()) {
        const statement = new StatementVisitor().visit(ctx.throwStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.breakStatement()) {
        const statement = new StatementVisitor().visit(ctx.breakStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.continueStatement()) {
        const statement = new StatementVisitor().visit(ctx.continueStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.insertStatement()) {
        const statement = new StatementVisitor().visit(ctx.insertStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.updateStatement()) {
        const statement = new StatementVisitor().visit(ctx.updateStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.deleteStatement()) {
        const statement = new StatementVisitor().visit(ctx.deleteStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.undeleteStatement()) {
        const statement = new StatementVisitor().visit(ctx.undeleteStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.upsertStatement()) {
        const statement = new StatementVisitor().visit(ctx.upsertStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.mergeStatement()) {
        const statement = new StatementVisitor().visit(ctx.mergeStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.runAsStatement()) {
        const statement = new StatementVisitor().visit(ctx.runAsStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.localVariableDeclarationStatement()) {
        const statement = new StatementVisitor().visit(ctx.localVariableDeclarationStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    if (ctx.expressionStatement()) {
        const statement = new StatementVisitor().visit(ctx.expressionStatement());
        return {
            type: 'statement',
            statement: statement,
        };
    }

    throw new Error('値が異常です。StatementContext: ' + ctx.getText());
};

