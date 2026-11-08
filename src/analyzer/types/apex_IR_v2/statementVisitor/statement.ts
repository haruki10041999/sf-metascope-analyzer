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
} from '.';

import { BlockTypeClass } from '../blockVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type StatementType = TypeField<'statement'> & {
    statement:
        | BlockTypeClass
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
};

export class StatementTypeClass extends ApexCommonTypeClass<'statement', StatementType> {
    private constructor(statement: StatementType['statement'], sourceSpan: SourceSpan) {
        super('statement', { statement: statement }, sourceSpan);
    }

    static create(ctx: StatementContext): StatementTypeClass {
        if (ctx.block()) {
            return new StatementTypeClass(BlockTypeClass.create(ctx.block()), getSourceSpan(ctx));
        } else if (ctx.ifStatement()) {
            return new StatementTypeClass(
                IfStatementTypeClass.create(ctx.ifStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.switchStatement()) {
            return new StatementTypeClass(
                SwitchStatementTypeClass.create(ctx.switchStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.forStatement()) {
            return new StatementTypeClass(
                ForStatementTypeClass.create(ctx.forStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.whileStatement()) {
            return new StatementTypeClass(
                WhileStatementTypeClass.create(ctx.whileStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.doWhileStatement()) {
            return new StatementTypeClass(
                DoWhileStatementTypeClass.create(ctx.doWhileStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.tryStatement()) {
            return new StatementTypeClass(
                TryStatementTypeClass.create(ctx.tryStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.returnStatement()) {
            return new StatementTypeClass(
                ReturnStatementTypeClass.create(ctx.returnStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.throwStatement()) {
            return new StatementTypeClass(
                ThrowStatementTypeClass.create(ctx.throwStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.breakStatement()) {
            return new StatementTypeClass(
                BreakStatementTypeClass.create(ctx.breakStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.continueStatement()) {
            return new StatementTypeClass(
                ContinueStatementTypeClass.create(ctx.continueStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.insertStatement()) {
            return new StatementTypeClass(
                InsertStatementTypeClass.create(ctx.insertStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.updateStatement()) {
            return new StatementTypeClass(
                UpdateStatementTypeClass.create(ctx.updateStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.deleteStatement()) {
            return new StatementTypeClass(
                DeleteStatementTypeClass.create(ctx.deleteStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.undeleteStatement()) {
            return new StatementTypeClass(
                UndeleteStatementTypeClass.create(ctx.undeleteStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.upsertStatement()) {
            return new StatementTypeClass(
                UpsertStatementTypeClass.create(ctx.upsertStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.mergeStatement()) {
            return new StatementTypeClass(
                MergeStatementTypeClass.create(ctx.mergeStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.runAsStatement()) {
            return new StatementTypeClass(
                RunAsStatementTypeClass.create(ctx.runAsStatement()),
                getSourceSpan(ctx),
            );
        } else if (ctx.localVariableDeclarationStatement()) {
            return new StatementTypeClass(
                LocalVariableDeclarationStatementTypeClass.create(
                    ctx.localVariableDeclarationStatement(),
                ),
                getSourceSpan(ctx),
            );
        } else {
            return new StatementTypeClass(
                ExpressionStatementTypeClass.create(ctx.expressionStatement()),
                getSourceSpan(ctx),
            );
        }
    }
}

export const isNormalStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is StatementTypeClass => {
    return isSpicifyApexCommonTypeClass('statement', target);
};
