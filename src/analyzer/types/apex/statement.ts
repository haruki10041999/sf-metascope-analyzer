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
} from './converter';

import { ExpressionType, makeExpressionType } from './expression';
import { TypeType, makeTypeType } from './type';
import { ModifierType, makeModifierType } from './modifier';
import { BlockType, makeBlockType } from './block';

type IfConditionBlock = {
    condition: ExpressionType;
    block: StatementType;
};

type IfStatementType = {
    type: 'if';
    conditionBlocks: IfConditionBlock[];
    elseBlock: NormalStatement | undefined;
};

type SwitchBlock = {
    condition:
    block: BlockType;
};

type EnhancedForType = {
    variableName: string;
    variableType: TypeType;
    iterable: ExpressionType;
};

type NormalForType = {
    init:
        | {
              type: TypeType;
              variants: { name: string; init: ExpressionType }[];
              modifier: ModifierType | undefined;
          }
        | ExpressionType[];
    condition: ExpressionType;
    update: ExpressionType[];
};

type ForStatement = {
    type: 'for';
    condition: EnhancedForType | NormalForType;
    block: NormalStatement;
};

type DmlStatementType = {
    type: 'insert' | 'update' | 'delete' | 'undelete';
    value: ExpressionType;
    accessLevel: string | undefined;
};

type UpsertStatementType = {
    type: 'upsert';
    value: ExpressionType;
    key: string[] | undefined;
    accessLevel: string | undefined;
};

type MergeStatementType = {
    type: 'merge';
    value: ExpressionType[];
    accessLevel: string | undefined;
};

type ExpressionStatementType = {
    type: 'expression';
    value: ExpressionType;
};

export type StatementType =
    | BlockType
    | IfStatementType
    | DmlStatementType
    | UpsertStatementType
    | MergeStatementType
    | ExpressionStatementType
    | undefined;

export const makeStatementType = (statement: NormalStatement): StatementType => {
    if (statement && statement.statement) {
        if (statement.type === 'block') {
            const value = statement.statement;
            if (value) {
                return makeBlockType(value);
            }
        }
        if (statement.type === 'if') {
            const value = statement.statement;
            if (value) {
                const conditionBlocks: IfConditionBlock[] = [];
                let elseBlock: StatementType = undefined;
                value.forEach((block) => {
                    const condition = block.value;
                    const conditionBlock = makeStatementType(block.block);
                    if (condition === 'else') {
                        elseBlock = conditionBlock;
                    } else {
                        conditionBlocks.push({
                            condition: makeExpressionType(condition),
                            block: conditionBlock,
                        });
                    }
                });

                return {
                    type: 'if',
                    conditionBlocks: conditionBlocks,
                    elseBlock: elseBlock,
                };
            }
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
            const value = statement.statement.value;
            const accessLevel = statement.statement.accessLevel;

            if (value) {
                return {
                    type: statement.type,
                    value: makeExpressionType(value),
                    accessLevel: accessLevel ? accessLevel : undefined,
                };
            }
        }
        if (statement.type === 'upsert') {
            const value = statement.statement.value;
            const key = statement.statement.key;
            const accessLevel = statement.statement.accessLevel;

            if (value) {
                return {
                    type: 'upsert',
                    value: makeExpressionType(value),
                    key: key ? key : undefined,
                    accessLevel: accessLevel ? accessLevel : undefined,
                };
            }
        }
        if (statement.type === 'merge') {
            const value = statement.statement.value;
            const accessLevel = statement.statement.accessLevel;

            if (value) {
                return {
                    type: 'merge',
                    value: value.map((v) => makeExpressionType(v)),
                    accessLevel: accessLevel ? accessLevel : undefined,
                };
            }
        }
        if (statement.type === 'runAs') {
        }
        if (statement.type === 'localVariable') {
        }
        if (statement.type === 'expression') {
            const value = statement.statement.expression;
            if (value) {
                return {
                    type: 'expression',
                    value: makeExpressionType(value),
                };
            }
        }
    }

    return undefined;
};
