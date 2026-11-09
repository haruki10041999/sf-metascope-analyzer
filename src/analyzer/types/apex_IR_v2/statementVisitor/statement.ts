import { StatementContext } from '@apexdevtools/apex-parser';

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

import { BlockTypeClass } from '../blockVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
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
    private constructor(fields: FieldsOf<StatementType>, sourceSpan: SourceSpan) {
        super('statement', fields, sourceSpan);
    }

    static create(ctx: StatementContext): StatementTypeClass {
        return new StatementTypeClass(
            { statement: StatementTypeClass.createStatement(ctx) },
            getSourceSpan(ctx),
        );
    }

    /** statement の選択肢のうち、ある子だけを作る */
    private static createStatement(ctx: StatementContext): StatementType['statement'] {
        if (ctx.block()) {
            return createNode(ctx.block(), (c) => BlockTypeClass.create(c), 'block');
        } else if (ctx.ifStatement()) {
            return createNode(
                ctx.ifStatement(),
                (c) => IfStatementTypeClass.create(c),
                'ifStatement',
            );
        } else if (ctx.switchStatement()) {
            return createNode(
                ctx.switchStatement(),
                (c) => SwitchStatementTypeClass.create(c),
                'switchStatement',
            );
        } else if (ctx.forStatement()) {
            return createNode(
                ctx.forStatement(),
                (c) => ForStatementTypeClass.create(c),
                'forStatement',
            );
        } else if (ctx.whileStatement()) {
            return createNode(
                ctx.whileStatement(),
                (c) => WhileStatementTypeClass.create(c),
                'whileStatement',
            );
        } else if (ctx.doWhileStatement()) {
            return createNode(
                ctx.doWhileStatement(),
                (c) => DoWhileStatementTypeClass.create(c),
                'doWhileStatement',
            );
        } else if (ctx.tryStatement()) {
            return createNode(
                ctx.tryStatement(),
                (c) => TryStatementTypeClass.create(c),
                'tryStatement',
            );
        } else if (ctx.returnStatement()) {
            return createNode(
                ctx.returnStatement(),
                (c) => ReturnStatementTypeClass.create(c),
                'returnStatement',
            );
        } else if (ctx.throwStatement()) {
            return createNode(
                ctx.throwStatement(),
                (c) => ThrowStatementTypeClass.create(c),
                'throwStatement',
            );
        } else if (ctx.breakStatement()) {
            return createNode(
                ctx.breakStatement(),
                (c) => BreakStatementTypeClass.create(c),
                'breakStatement',
            );
        } else if (ctx.continueStatement()) {
            return createNode(
                ctx.continueStatement(),
                (c) => ContinueStatementTypeClass.create(c),
                'continueStatement',
            );
        } else if (ctx.insertStatement()) {
            return createNode(
                ctx.insertStatement(),
                (c) => InsertStatementTypeClass.create(c),
                'insertStatement',
            );
        } else if (ctx.updateStatement()) {
            return createNode(
                ctx.updateStatement(),
                (c) => UpdateStatementTypeClass.create(c),
                'updateStatement',
            );
        } else if (ctx.deleteStatement()) {
            return createNode(
                ctx.deleteStatement(),
                (c) => DeleteStatementTypeClass.create(c),
                'deleteStatement',
            );
        } else if (ctx.undeleteStatement()) {
            return createNode(
                ctx.undeleteStatement(),
                (c) => UndeleteStatementTypeClass.create(c),
                'undeleteStatement',
            );
        } else if (ctx.upsertStatement()) {
            return createNode(
                ctx.upsertStatement(),
                (c) => UpsertStatementTypeClass.create(c),
                'upsertStatement',
            );
        } else if (ctx.mergeStatement()) {
            return createNode(
                ctx.mergeStatement(),
                (c) => MergeStatementTypeClass.create(c),
                'mergeStatement',
            );
        } else if (ctx.runAsStatement()) {
            return createNode(
                ctx.runAsStatement(),
                (c) => RunAsStatementTypeClass.create(c),
                'runAsStatement',
            );
        } else if (ctx.localVariableDeclarationStatement()) {
            return createNode(
                ctx.localVariableDeclarationStatement(),
                (c) => LocalVariableDeclarationStatementTypeClass.create(c),
                'localVariableDeclarationStatement',
            );
        }
        // どの子もなければ (構文エラーの回復) expressionStatement も null になり NULL_CHILD になる
        return createNode(
            ctx.expressionStatement(),
            (c) => ExpressionStatementTypeClass.create(c),
            'expressionStatement',
        );
    }

    getStatement(): StatementType['statement'] {
        return this.getFields().statement;
    }
}

export const isStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is StatementTypeClass => {
    return isSpicifyApexCommonTypeClass('statement', target);
};
