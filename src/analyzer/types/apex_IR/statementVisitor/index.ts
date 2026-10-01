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

import { NormalStatementTypeClass } from './normal';
import { IfStatementType, makeIfStatementType } from './ifStatement';
import { SwitchStatementType, makeSwitchStatementType } from './switchStatement';
import { ForStatementType, makeForStatementType } from './forStatement';
import { WhileStatementType, makeWhileStatementType } from './whileStatement';
import { DoWhileStatementType, makeDoWhileStatementType } from './doWhileStatement';
import { TryStatementType, makeTryStatementType } from './tryStatement';
import { ReturnStatementTypeClass } from './returnStatement';
import { ThrowStatementType, makeThrowStatementType } from './throwStatement';
import { BreakStatementTypeClass } from './breakStatement';
import { ContinueStatementTypeClass } from './continueStatement';
import { InsertStatementTypeClass } from './insertStatement';
import { UpdateStatementTypeClass } from './updateStatement';
import { DeleteStatementTypeClass } from './deleteStatement';
import { UndeleteStatementTypeClass } from './undeleteStatement';
import { UpsertStatementTypeClass } from './upsertStatement';
import { MergeStatementTypeClass } from './mergeStatement';
import { RunAsStatementType, makeRunAsStatementType } from './runAsStatement';
import {
    LocalVariableDeclarationStatementType,
    makeLocalVariableDeclarationStatementType,
} from './localVariableDeclarationStatement';
import { ExpressionStatementType, makeExpressionStatementType } from './expressionStatement';
import { AccessLevelTypeClass } from './accessLevel';

import { ErrorTypeClass, ContextTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isNormalStatementType, NormalStatementTypeClass } from './normal';
export { isReturnStatementType, ReturnStatementTypeClass } from './returnStatement';
export { isBreakStatementType, BreakStatementTypeClass } from './breakStatement';
export { isContinueStatementType, ContinueStatementTypeClass } from './continueStatement';
export { isInsertStatementType, InsertStatementTypeClass } from './insertStatement';
export { isUpdateStatementType, UpdateStatementTypeClass } from './updateStatement';
export { isDeleteStatementType, DeleteStatementTypeClass } from './deleteStatement';
export { isUndeleteStatementType, UndeleteStatementTypeClass } from './undeleteStatement';
export { isUpsertStatementType, UpsertStatementTypeClass } from './upsertStatement';
export { isMergeStatementType, MergeStatementTypeClass } from './mergeStatement';
export { isAccessLevelType, AccessLevelTypeClass } from './accessLevel';

export class StatementTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
    }
}

export class DmlStatementTypeClass<T> extends StatementTypeClass<T> {
    private accessLevel: AccessLevelTypeClass | null = null;
    constructor(
        type: string,
        value: T | null,
        accessLevel: AccessLevelTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super(type, value, errorClasses);
        this.accessLevel = accessLevel;
    }

    getAccessLevel(): AccessLevelTypeClass | null {
        return this.accessLevel;
    }

    isAccessLevelNull(): boolean {
        return this.accessLevel === null;
    }
}

export const isStatementTypeAll = (
    target: CommonTypeClass,
): target is StatementTypeClass<unknown> => {
    return target instanceof StatementTypeClass;
};

export class StatementVisitor extends CommonVisitor<StatementTypeClass<unknown>> {
    visitStatement(ctx: StatementContext) {
        return NormalStatementTypeClass.create(ctx);
    }

    visitIfStatement(ctx: IfStatementContext) {
        console.log('解析を開始します。' + 'IfStatementContext:  ' + ctx.getText());
        const result = makeIfStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'IfStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSwitchStatement(ctx: SwitchStatementContext) {
        console.log('解析を開始します。' + 'SwitchStatementContext:  ' + ctx.getText());
        const result = makeSwitchStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SwitchStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitForStatement(ctx: ForStatementContext) {
        console.log('解析を開始します。' + 'ForStatementContext:  ' + ctx.getText());
        const result = makeForStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ForStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitWhileStatement(ctx: WhileStatementContext) {
        console.log('解析を開始します。' + 'WhileStatementContext:  ' + ctx.getText());
        const result = makeWhileStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'WhileStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitDoWhileStatement(ctx: DoWhileStatementContext) {
        console.log('解析を開始します。' + 'DoWhileStatementContext:  ' + ctx.getText());
        const result = makeDoWhileStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'DoWhileStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitTryStatement(ctx: TryStatementContext) {
        console.log('解析を開始します。' + 'TryStatementContext:  ' + ctx.getText());
        const result = makeTryStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TryStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitReturnStatement(ctx: ReturnStatementContext) {
        return ReturnStatementTypeClass.create(ctx);
    }

    visitThrowStatement(ctx: ThrowStatementContext) {
        console.log('解析を開始します。' + 'ThrowStatementContext:  ' + ctx.getText());
        const result = makeThrowStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ThrowStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'UpdateStatementContext:  ' + ctx.getText());
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
        console.log('解析を開始します。' + 'RunAsStatementContext:  ' + ctx.getText());
        const result = makeRunAsStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'RunAsStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitLocalVariableDeclarationStatement(ctx: LocalVariableDeclarationStatementContext) {
        console.log(
            '解析を開始します。' + 'LocalVariableDeclarationStatementContext:  ' + ctx.getText(),
        );
        const result = makeLocalVariableDeclarationStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'LocalVariableDeclarationStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitExpressionStatement(ctx: ExpressionStatementContext) {
        console.log('解析を開始します。' + 'ExpressionStatementContext:  ' + ctx.getText());
        const result = makeExpressionStatementType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ExpressionStatementContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitAccessLevel(ctx: AccessLevelContext) {
        return AccessLevelTypeClass.create(ctx);
    }
}

