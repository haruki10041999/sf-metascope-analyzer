import {
    NormalStatement,
    NormalBlock,
    IfStatement,
    SwitchStatement,
    ForStatement,
    WhileStatement,
    DoWhileStatement,
    TryStatement,
    ReturnStatement,
    BreakStatement,
    ContinueStatement,
    ThrowStatement,
    DmlStatement,
    UpsertStatement,
    MergeStatement,
    RunAsStatement,
    LocalVariableDeclarationStatement,
    ExpressionStatement,
} from '../converter';

export const makeStatementType = (statement: NormalStatement) => {
    if (statement && statement.statement) {
        if (statement.type === 'block') {
        }
        if (statement.type === 'if') {
        }
        if (statement.type === 'switch') {
        }
        if (statement.type === 'for') {
        }
        if (statement.type === 'while') {
        }
        if (statement.type === 'doWhile') {
        }
        if (statement.type === 'try') {
        }
        if (statement.type === 'return') {
        }
        if (statement.type === 'break') {
        }
        if (statement.type === 'continue') {
        }
        if (statement.type === 'throw') {
        }
        if (
            statement.type === 'insert' ||
            statement.type === 'update' ||
            statement.type === 'delete' ||
            statement.type === 'undelete'
        ) {
        }
        if (statement.type === 'upsert') {
        }
        if (statement.type === 'merge') {
        }
        if (statement.type === 'runAs') {
        }
        if (statement.type === 'localVariable') {
        }
        if (statement.type === 'expression') {
        }
    }

    return undefined;
};
