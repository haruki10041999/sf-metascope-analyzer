import typia from 'typia';

import {
    ConvertExcludeError,
    ConvertType,
    ConvertWithError,
    convertValue,
    ErrorJson,
    JsonType,
    makeJsonType,
    StructureJson,
    makeStructureJson,
    isErrorNode,
    makeErrorJson,
    ConvertKeys,
} from './commons';

import {
    AccessLevelType,
    BlockType,
    BreakStatementType,
    ContinueStatementType,
    DeleteStatementType,
    DoWhileStatementType,
    ParExpressionType,
    ExpressionStatementType,
    ForControlType,
    ForStatementType,
    IfStatementType,
    InsertStatementType,
    LocalVariableDeclarationStatementType,
    MergeStatementType,
    ReturnStatementType,
    ExpressionListType,
    RunAsStatementType,
    StatementType,
    BaseExpressionType,
    WhenValueType,
    SwitchStatementType,
    ThrowStatementType,
    CatchClauseType,
    TryStatementType,
    UndeleteStatementType,
    UpdateStatementType,
    UpsertStatementType,
    WhileStatementType,
} from './converter';
import { BaseExpressionJson, makeExpressionJsonConvert } from './expression';
import { TypeJson, makeTypeJson } from './type';
import { LocalVariableDeclarationJson, makeLocalVariableDeclarationJson } from './declaration';
import { makeModifierJson, ModifierJson, AnnotationJson } from './modifier';

const ERROR_KIND = 'statement';

const makeAccessLevelJson = (target: ConvertExcludeError<AccessLevelType>): 'SYSTEM' | 'USER' => {
    return target.value;
};

export type BreakStatementJson = JsonType<'break'> & {
    value: string;
};
export const isBreakStatementJson = typia.createIs<BreakStatementJson>();

export const makeBreakStatementJson = (
    target: ConvertType<BreakStatementType>,
): BreakStatementJson | ErrorJson => {
    return convertValue<'breakStatement', BreakStatementType, BreakStatementJson>(
        target,
        'break',
        (target, targetRecords) => {
            return makeJsonType('break', targetRecords.base, {
                value: target.value,
            });
        },
    );
};

export type ContinueStatementJson = JsonType<'continue'> & {
    value: string;
};
export const isContinueStatementJson = typia.createIs<ContinueStatementJson>();

export const makeContinueStatementJson = (
    target: ConvertType<ContinueStatementType>,
): ContinueStatementJson | ErrorJson => {
    return convertValue<'continueStatement', ContinueStatementType, ContinueStatementJson>(
        target,
        'continue',
        (target, targetRecords) => {
            return makeJsonType('continue', targetRecords.base, {
                value: target.value,
            });
        },
    );
};

export type DeleteStatementJson = JsonType<'delete'> & {
    field: BaseExpressionJson | ErrorJson;
    accessLevel?: 'SYSTEM' | 'USER';
};
export const isDeleteStatementJson = typia.createIs<DeleteStatementJson>();

export const makeDeleteStatementJson = (
    target: ConvertType<DeleteStatementType>,
): DeleteStatementJson | ErrorJson => {
    return convertValue<'deleteStatement', DeleteStatementType, DeleteStatementJson>(
        target,
        'delete',
        (target, targetRecords) => {
            return makeJsonType('delete', targetRecords.base, {
                field: makeExpressionJsonConvert(target.value),
                ...(target.accessLevel
                    ? { accessLevel: makeAccessLevelJson(target.accessLevel) }
                    : {}),
            });
        },
    );
};

export type DoWhileConditionJson = JsonType<'doWhileCondition'> & {
    condition: BaseExpressionJson | ErrorJson;
};
export const isDoWhileConditionJson = typia.createIs<DoWhileConditionJson>();

const makeDoWhileConditionJson = (
    target: ConvertType<ParExpressionType>,
): DoWhileConditionJson | ErrorJson => {
    return convertValue<'parExpression', ParExpressionType, DoWhileConditionJson>(
        target,
        'doWhileCondition',
        (target, targetRecords) => {
            return makeJsonType('doWhileCondition', targetRecords.base, {
                condition: makeExpressionJsonConvert(target.value),
            });
        },
    );
};

// 複合文は文全体の位置を持つ境界ノード。条件・本体は子の変換関数がエラーを処理するため、検査はノード自身だけ
export type DoWhileStatementJson = JsonType<'doWhile'> & {
    condition: DoWhileConditionJson | ErrorJson;
    body: (StatementJson | ErrorJson)[];
};
export const isDoWhileStatementJson = typia.createIs<DoWhileStatementJson>();

const makeDoWhileStatementJson = (
    target: ConvertType<DoWhileStatementType>,
): DoWhileStatementJson | ErrorJson => {
    return convertValue<'doWhileStatement', DoWhileStatementType, DoWhileStatementJson>(
        target,
        'doWhile',
        (statement: ConvertWithError<DoWhileStatementType>, targetRecords) => {
            return makeJsonType('doWhile', targetRecords.base, {
                condition: makeDoWhileConditionJson(statement.value),
                body: makeBlockJson(statement.block),
            });
        },
        { exclude: 'children' },
    );
};

export type ExpressionStatementJson = JsonType<'expression'> & {
    value: BaseExpressionJson | ErrorJson;
};

export const isExpressionStatementJson = typia.createIs<ExpressionStatementJson>();

const makeExpressionStatementJson = (
    target: ConvertType<ExpressionStatementType>,
): ExpressionStatementJson | ErrorJson => {
    return convertValue<'expressionStatement', ExpressionStatementType, ExpressionStatementJson>(
        target,
        'expression',
        (target, targetRecords) => {
            return makeJsonType('expression', targetRecords.base, {
                value: makeExpressionJsonConvert(target.value),
            });
        },
    );
};

export type ForConditionJson = JsonType<'forCondition'> &
    (
        | {
              initializer: string;
              initializeType: TypeJson | ErrorJson;
              baseObject: BaseExpressionJson | ErrorJson;
          }
        | {
              initializer?: LocalVariableDeclarationJson | (BaseExpressionJson | ErrorJson)[];
              condition?: BaseExpressionJson | ErrorJson;
              update?: (BaseExpressionJson | ErrorJson)[];
          }
    );

export const isForConditionJson = typia.createIs<ForConditionJson>();

const makeForConditionJson = (
    target: ConvertType<ForControlType>,
): ForConditionJson | ErrorJson => {
    return convertValue<'forControl', ForControlType, ForConditionJson>(
        target,
        'forCondition',
        (target, targetRecords) => {
            const condition = target.value;
            if (condition && condition.type === 'enhancedForControl') {
                return makeJsonType('forCondition', targetRecords.base, {
                    initializer: condition.value.value,
                    initializeType: makeTypeJson(condition.valueType),
                    baseObject: makeExpressionJsonConvert(condition.fromVariant),
                });
            }

            // for (;;) の init / 条件 / update はそれぞれ省略されうる
            const init = target.init;
            const initializer = init
                ? init.value.type === 'localVariableDeclaration'
                    ? makeLocalVariableDeclarationJson(init.value)
                    : init.value.value.map((v) => makeExpressionJsonConvert(v))
                : null;

            return makeJsonType('forCondition', targetRecords.base, {
                ...(initializer ? { initializer: initializer } : {}),
                ...(condition ? { condition: makeExpressionJsonConvert(condition) } : {}),
                ...(target.update
                    ? { update: target.update.value.value.map(makeExpressionJsonConvert) }
                    : {}),
            });
        },
    );
};

type ForStatementJson = JsonType<'for'> & {
    condition: ForConditionJson | ErrorJson;
    block: StatementJson | ErrorJson;
};

export const isForStatementJson = typia.createIs<ForStatementJson>();

const makeForStatementJson = (
    target: ConvertType<ForStatementType>,
): ForStatementJson | ErrorJson => {
    return convertValue<'forStatement', ForStatementType, ForStatementJson>(
        target,
        'for',
        (statement: ConvertWithError<ForStatementType>, targetRecords) => {
            return makeJsonType('for', targetRecords.base, {
                condition: makeForConditionJson(statement.value),
                block: makeStatementJson(statement.block),
            });
        },
        { exclude: 'children' },
    );
};

export type IfConditionJson = JsonType<'ifCondition'> & {
    condition: BaseExpressionJson | ErrorJson;
};
export const isIfConditionJson = typia.createIs<IfConditionJson>();

const makeIfConditionJson = (
    target: ConvertType<ParExpressionType>,
): IfConditionJson | ErrorJson => {
    return convertValue<'parExpression', ParExpressionType, IfConditionJson>(
        target,
        'ifCondition',
        (target, targetRecords) => {
            return makeJsonType('ifCondition', targetRecords.base, {
                condition: makeExpressionJsonConvert(target.value),
            });
        },
    );
};

type IfStatementJson = JsonType<'if'> & {
    conditionBlock:
        | {
              condition: 'else' | IfConditionJson | ErrorJson;
              block: StatementJson | ErrorJson;
          }[]
        | ErrorJson;
};

export const isIfStatementJson = typia.createIs<IfStatementJson>();

const makeIfStatementJson = (target: ConvertType<IfStatementType>): IfStatementJson | ErrorJson => {
    return convertValue<'ifStatement', IfStatementType, IfStatementJson>(
        target,
        'if',
        (statement: ConvertWithError<IfStatementType>, targetRecords) => {
            const blocks = statement.value;
            return makeJsonType('if', targetRecords.base, {
                conditionBlock: !Array.isArray(blocks)
                    ? makeErrorJson(blocks, ERROR_KIND)
                    : blocks.map((block) => ({
                          condition:
                              typeof block.condition === 'string'
                                  ? block.condition
                                  : makeIfConditionJson(block.condition),
                          block: makeStatementJson(block.block),
                      })),
            });
        },
        { exclude: 'children' },
    );
};

type InsertStatementJson = JsonType<'insert'> & {
    field: BaseExpressionJson | ErrorJson;
    accessLevel?: 'SYSTEM' | 'USER';
};
export const isInsertStatementJson = typia.createIs<InsertStatementJson>();

export const makeInsertStatementJson = (
    target: ConvertType<InsertStatementType>,
): InsertStatementJson | ErrorJson => {
    return convertValue<'insertStatement', InsertStatementType, InsertStatementJson>(
        target,
        'insert',
        (target, targetRecords) => {
            return makeJsonType('insert', targetRecords.base, {
                field: makeExpressionJsonConvert(target.value),
                ...(target.accessLevel
                    ? { accessLevel: makeAccessLevelJson(target.accessLevel) }
                    : {}),
            });
        },
    );
};

type LocalVariableStatementJson = JsonType<'localVariable'> & {
    variable: LocalVariableDeclarationJson;
};
export const isLocalVariableStatementJson = typia.createIs<LocalVariableStatementJson>();

export const makeLocalVariableStatementJson = (
    target: ConvertType<LocalVariableDeclarationStatementType>,
): LocalVariableStatementJson | ErrorJson => {
    return convertValue<
        'localVariableDeclarationStatement',
        LocalVariableDeclarationStatementType,
        LocalVariableStatementJson
    >(target, 'localVariable', (target, targetRecords) => {
        return makeJsonType('localVariable', targetRecords.base, {
            variable: makeLocalVariableDeclarationJson(target.value),
        });
    });
};

type MergeStatementJson = JsonType<'merge'> & {
    field: (BaseExpressionJson | ErrorJson)[];
    accessLevel?: 'SYSTEM' | 'USER';
};
export const isMergeStatementJson = typia.createIs<MergeStatementJson>();

export const makeMergeStatementJson = (
    target: ConvertType<MergeStatementType>,
): MergeStatementJson | ErrorJson => {
    return convertValue<'mergeStatement', MergeStatementType, MergeStatementJson>(
        target,
        'merge',
        (target, targetRecords) => {
            return makeJsonType('merge', targetRecords.base, {
                field: target.value.map((v) => makeExpressionJsonConvert(v)),
                ...(target.accessLevel
                    ? { accessLevel: makeAccessLevelJson(target.accessLevel) }
                    : {}),
            });
        },
    );
};

type ReturnStatementJson = JsonType<'return'> & {
    field?: BaseExpressionJson | ErrorJson;
};
export const isReturnStatementJson = typia.createIs<ReturnStatementJson>();

export const makeReturnStatementJson = (
    target: ConvertType<ReturnStatementType>,
): ReturnStatementJson | ErrorJson => {
    return convertValue<'returnStatement', ReturnStatementType, ReturnStatementJson>(
        target,
        'return',
        (target, targetRecords) => {
            return makeJsonType('return', targetRecords.base, {
                ...(target.value ? { field: makeExpressionJsonConvert(target.value) } : {}),
            });
        },
    );
};

type RunAsConditionJson = JsonType<'runAsCondition'> & {
    field: (BaseExpressionJson | ErrorJson)[];
};
export const isRunAsConditionJson = typia.createIs<RunAsConditionJson>();

const makeRunAsConditionJson = (
    target: ConvertType<ExpressionListType>,
): RunAsConditionJson | ErrorJson => {
    return convertValue<'expressionList', ExpressionListType, RunAsConditionJson>(
        target,
        'runAsCondition',
        (target, targetRecords) => {
            return makeJsonType('runAsCondition', targetRecords.base, {
                field: target.value.map((v) => makeExpressionJsonConvert(v)),
            });
        },
    );
};

type RunAsStatementJson = JsonType<'runAs'> & {
    condition: ErrorJson | RunAsConditionJson;
    block: (StatementJson | ErrorJson)[];
};

export const isRunAsStatementJson = typia.createIs<RunAsStatementJson>();

export const makeRunAsStatementJson = (
    target: ConvertType<RunAsStatementType>,
): RunAsStatementJson | ErrorJson => {
    return convertValue<'runAsStatement', RunAsStatementType, RunAsStatementJson>(
        target,
        'runAs',
        (statement: ConvertWithError<RunAsStatementType>, targetRecords) => {
            return makeJsonType('runAs', targetRecords.base, {
                condition: makeRunAsConditionJson(statement.value),
                block: makeBlockJson(statement.block),
            });
        },
        { exclude: 'children' },
    );
};

type WhenVariantJson = JsonType<'whenVariant'> & {
    variant: BaseExpressionJson | ErrorJson;
};

export const isWhenVariantJson = typia.createIs<WhenVariantJson>();

export const makeWhenVariantJson = (
    target: ConvertType<BaseExpressionType>,
): WhenVariantJson | ErrorJson => {
    return convertValue<
        | 'expression'
        | 'primaryExpression'
        | 'dotExpression'
        | 'methodCallExpression'
        | 'newExpression'
        | 'castExpression'
        | 'subExpression'
        | 'arrayExpression'
        | 'arth1Expression'
        | 'arth2Expression'
        | 'assignExpression'
        | 'bitAndExpression'
        | 'bitExpression'
        | 'bitOrExpression'
        | 'bitNotExpression'
        | 'cmpExpression'
        | 'coalExpression'
        | 'condExpression'
        | 'equalityExpression'
        | 'instanceOfExpression'
        | 'logAndExpression'
        | 'logOrExpression'
        | 'negExpression'
        | 'postOpExpression'
        | 'preOpExpression',
        BaseExpressionType,
        WhenVariantJson
    >(target, 'whenVariant', (target, targetRecords) => {
        return makeJsonType('whenVariant', targetRecords.base, {
            variant: makeExpressionJsonConvert(target),
        });
    });
};

type WhenConditionJson = JsonType<'switchCondition'> & {
    condition:
        | 'else'
        | (
              | {
                    value: string;
                    valueType: 'string' | 'longText' | 'null';
                }
              | {
                    value: string;
                    valueType: 'integer' | 'long';
                    operator?: string;
                }
              | {
                    value: string[];
                    valueType: 'id';
                }
          )[]
        | { value: string; valueType: TypeJson | ErrorJson };
};

export const makeWhenConditionJson = (
    target: ConvertType<WhenValueType>,
): WhenConditionJson | ErrorJson => {
    return convertValue<'whenValue', WhenValueType, WhenConditionJson>(
        target,
        'switchCondition',
        (target, targetRecords) => {
            if ('valueType' in target) {
                return makeJsonType('switchCondition', targetRecords.base, {
                    condition: {
                        value: target.value.value,
                        valueType: makeTypeJson(target.valueType),
                    },
                });
            } else if (typeof target.value === 'string') {
                return makeJsonType('switchCondition', targetRecords.base, { condition: 'else' });
            }
            return makeJsonType('switchCondition', targetRecords.base, {
                condition: target.value.map((v) => {
                    if (v.valueType === 'id') {
                        return {
                            value: v.value.value.map((part) => part.value),
                            valueType: v.valueType,
                        };
                    } else if (v.valueType === 'integer' || v.valueType === 'long') {
                        return {
                            value: v.value,
                            valueType: v.valueType,
                            ...(v.operator ? { operator: v.operator } : {}),
                        };
                    }
                    return {
                        value: v.value,
                        valueType: v.valueType,
                    };
                }),
            });
        },
    );
};

type SwitchStatementJson = JsonType<'switch'> & {
    variant: WhenVariantJson | ErrorJson;
    block: (
        | {
              condition: WhenConditionJson | ErrorJson;
              block: (StatementJson | ErrorJson)[];
          }
        | ErrorJson
    )[];
};

export const isSwitchStatementJson = typia.createIs<SwitchStatementJson>();

const makeSwitchStatementJson = (
    target: ConvertType<SwitchStatementType>,
): SwitchStatementJson | ErrorJson => {
    return convertValue<'switchStatement', SwitchStatementType, SwitchStatementJson>(
        target,
        'switch',
        (statement: ConvertWithError<SwitchStatementType>, targetRecords) => {
            return makeJsonType('switch', targetRecords.base, {
                variant: makeWhenVariantJson(statement.value),
                block: statement.block.map((b) => {
                    if (isErrorNode(b)) {
                        return makeErrorJson(b, ERROR_KIND);
                    }
                    return {
                        condition: makeWhenConditionJson(b.value),
                        block: makeBlockJson(b.block),
                    };
                }),
            });
        },
        { exclude: 'children' },
    );
};

type ThrowStatementJson = JsonType<'throw'> & {
    value: BaseExpressionJson | ErrorJson;
};

export const isThrowStatementJson = typia.createIs<ThrowStatementJson>();

export const makeThrowStatementJson = (
    target: ConvertType<ThrowStatementType>,
): ThrowStatementJson | ErrorJson => {
    return convertValue<'throwStatement', ThrowStatementType, ThrowStatementJson>(
        target,
        'throw',
        (target, targetRecords) => {
            return makeJsonType('throw', targetRecords.base, {
                value: makeExpressionJsonConvert(target.value),
            });
        },
    );
};

type CatchConditionJson = StructureJson<
    'catchCondition',
    {
        exception: ConvertKeys;
        exceptionType: ConvertKeys;
    }
> & {
    exception: string;
    exceptionType: string[];
    modifier: (ModifierJson | AnnotationJson | ErrorJson)[];
};

export const isCatchConditionJson = typia.createIs<CatchConditionJson>();

const makeCatchConditionJson = (
    target: ConvertType<CatchClauseType>,
): CatchConditionJson | ErrorJson => {
    return convertValue<
        'catchClause',
        CatchClauseType,
        CatchConditionJson,
        {
            exception: ConvertKeys;
            exceptionType: ConvertKeys;
        }
    >(
        target,
        'catchCondition',
        (target, targetRecords) => {
            return makeStructureJson('catchCondition', targetRecords, {
                exception: target.value.value,
                exceptionType: target.valueType.value.map((v) => v.value),
                modifier: target.modifier.map((m) => makeModifierJson(m)),
            });
        },
        {
            // catch 本体の文は makeTryStatementJson 側で処理するため、検査範囲から外す
            exclude: ['block'],
            record: { exception: 'value', exceptionType: 'valueType' },
        },
    );
};

type TryStatementJson = JsonType<'try'> & {
    block: (
        | {
              condition: 'try';
              block: (StatementJson | ErrorJson)[];
          }
        | {
              condition: 'catch';
              catchCondition: CatchConditionJson | ErrorJson;
              block: (StatementJson | ErrorJson)[];
          }
        | {
              condition: 'finally';
              block: (StatementJson | ErrorJson)[];
          }
        | ErrorJson
    )[];
};

export const isTryStatementJson = typia.createIs<TryStatementJson>();

const makeTryBlocksJson = (
    target: ConvertWithError<TryStatementType>,
): TryStatementJson['block'] => {
    const tryBlock: { condition: 'try'; block: (StatementJson | ErrorJson)[] } = {
        condition: 'try',
        block: makeBlockJson(target.block),
    };
    const catchBlocks = target.catchBlock.map(
        (
            b,
        ):
            | {
                  condition: 'catch';
                  catchCondition: CatchConditionJson | ErrorJson;
                  block: (StatementJson | ErrorJson)[];
              }
            | ErrorJson => {
            if (isErrorNode(b)) {
                return makeErrorJson(b, ERROR_KIND);
            }
            return {
                condition: 'catch',
                catchCondition: makeCatchConditionJson(b),
                block: makeBlockJson(b.block),
            };
        },
    );

    const finally_ = target.finallyBlock;
    const finallyBlock:
        | {
              condition: 'finally';
              block: (StatementJson | ErrorJson)[];
          }
        | ErrorJson
        | null = finally_
        ? isErrorNode(finally_)
            ? makeErrorJson(finally_, ERROR_KIND)
            : {
                  condition: 'finally',
                  block: makeBlockJson(finally_.block),
              }
        : null;

    return [tryBlock, ...catchBlocks, ...(finallyBlock ? [finallyBlock] : [])];
};

const makeTryStatementJson = (
    target: ConvertType<TryStatementType>,
): TryStatementJson | ErrorJson => {
    return convertValue<'tryStatement', TryStatementType, TryStatementJson>(
        target,
        'try',
        (statement, targetRecords) => {
            return makeJsonType('try', targetRecords.base, {
                block: makeTryBlocksJson(statement),
            });
        },
        { exclude: 'children' },
    );
};

type UndeleteStatementJson = JsonType<'undelete'> & {
    field: BaseExpressionJson | ErrorJson;
    accessLevel?: 'SYSTEM' | 'USER';
};
export const isUndeleteStatementJson = typia.createIs<UndeleteStatementJson>();

export const makeUndeleteStatementJson = (
    target: ConvertType<UndeleteStatementType>,
): UndeleteStatementJson | ErrorJson => {
    return convertValue<'undeleteStatement', UndeleteStatementType, UndeleteStatementJson>(
        target,
        'undelete',
        (target, targetRecords) => {
            return makeJsonType('undelete', targetRecords.base, {
                field: makeExpressionJsonConvert(target.value),
                ...(target.accessLevel
                    ? { accessLevel: makeAccessLevelJson(target.accessLevel) }
                    : {}),
            });
        },
    );
};

type UpdateStatementJson = JsonType<'update'> & {
    field: BaseExpressionJson | ErrorJson;
    accessLevel?: 'SYSTEM' | 'USER';
};
export const isUpdateStatementJson = typia.createIs<UpdateStatementJson>();

export const makeUpdateStatementJson = (
    target: ConvertType<UpdateStatementType>,
): UpdateStatementJson | ErrorJson => {
    return convertValue<'updateStatement', UpdateStatementType, UpdateStatementJson>(
        target,
        'update',
        (target, targetRecords) => {
            return makeJsonType('update', targetRecords.base, {
                field: makeExpressionJsonConvert(target.value),
                ...(target.accessLevel
                    ? { accessLevel: makeAccessLevelJson(target.accessLevel) }
                    : {}),
            });
        },
    );
};

type UpsertStatementJson = JsonType<'upsert'> & {
    field: BaseExpressionJson | ErrorJson;
    accessLevel?: 'SYSTEM' | 'USER';
    key?: string[];
};
export const isUpsertStatementJson = typia.createIs<UpsertStatementJson>();

export const makeUpsertStatementJson = (
    target: ConvertType<UpsertStatementType>,
): UpsertStatementJson | ErrorJson => {
    return convertValue<'upsertStatement', UpsertStatementType, UpsertStatementJson>(
        target,
        'upsert',
        (target, targetRecords) => {
            return makeJsonType('upsert', targetRecords.base, {
                field: makeExpressionJsonConvert(target.value),
                ...(target.accessLevel
                    ? { accessLevel: makeAccessLevelJson(target.accessLevel) }
                    : {}),
                ...(target.key ? { key: target.key.value.map((v) => v.value) } : {}),
            });
        },
    );
};

export type WhileConditionJson = JsonType<'whileCondition'> & {
    condition: BaseExpressionJson | ErrorJson;
};
export const isWhileConditionJson = typia.createIs<WhileConditionJson>();

const makeWhileConditionJson = (
    target: ConvertType<ParExpressionType>,
): WhileConditionJson | ErrorJson => {
    return convertValue<'parExpression', ParExpressionType, WhileConditionJson>(
        target,
        'whileCondition',
        (target, targetRecords) => {
            return makeJsonType('whileCondition', targetRecords.base, {
                condition: makeExpressionJsonConvert(target.value),
            });
        },
    );
};

export type WhileStatementJson = JsonType<'while'> & {
    condition: WhileConditionJson | ErrorJson;
    body: StatementJson | ErrorJson;
};
export const isWhileStatementJson = typia.createIs<WhileStatementJson>();

const makeWhileStatementJson = (
    target: ConvertType<WhileStatementType>,
): WhileStatementJson | ErrorJson => {
    return convertValue<'whileStatement', WhileStatementType, WhileStatementJson>(
        target,
        'while',
        (statement: ConvertWithError<WhileStatementType>, targetRecords) => {
            return makeJsonType('while', targetRecords.base, {
                condition: makeWhileConditionJson(statement.value),
                body: makeStatementJson(statement.block),
            });
        },
        { exclude: 'children' },
    );
};

export type StatementJson =
    | (StatementJson | ErrorJson)[]
    | BreakStatementJson
    | ContinueStatementJson
    | DeleteStatementJson
    | DoWhileStatementJson
    | ExpressionStatementJson
    | ForStatementJson
    | IfStatementJson
    | InsertStatementJson
    | LocalVariableStatementJson
    | MergeStatementJson
    | ReturnStatementJson
    | RunAsStatementJson
    | SwitchStatementJson
    | ThrowStatementJson
    | TryStatementJson
    | UndeleteStatementJson
    | UpdateStatementJson
    | UpsertStatementJson
    | WhileStatementJson;

export const makeStatementJson = (
    target: ConvertType<StatementType>,
): StatementJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }

    const statement = target.value;
    if (isErrorNode(statement)) {
        return makeErrorJson(statement, ERROR_KIND);
    }

    if (statement.type === 'breakStatement') {
        return makeBreakStatementJson(statement);
    } else if (statement.type === 'continueStatement') {
        return makeContinueStatementJson(statement);
    } else if (statement.type === 'deleteStatement') {
        return makeDeleteStatementJson(statement);
    } else if (statement.type === 'doWhileStatement') {
        return makeDoWhileStatementJson(statement);
    } else if (statement.type === 'expressionStatement') {
        return makeExpressionStatementJson(statement);
    } else if (statement.type === 'forStatement') {
        return makeForStatementJson(statement);
    } else if (statement.type === 'ifStatement') {
        return makeIfStatementJson(statement);
    } else if (statement.type === 'insertStatement') {
        return makeInsertStatementJson(statement);
    } else if (statement.type === 'localVariableDeclarationStatement') {
        return makeLocalVariableStatementJson(statement);
    } else if (statement.type === 'mergeStatement') {
        return makeMergeStatementJson(statement);
    } else if (statement.type === 'returnStatement') {
        return makeReturnStatementJson(statement);
    } else if (statement.type === 'runAsStatement') {
        return makeRunAsStatementJson(statement);
    } else if (statement.type === 'switchStatement') {
        return makeSwitchStatementJson(statement);
    } else if (statement.type === 'throwStatement') {
        return makeThrowStatementJson(statement);
    } else if (statement.type === 'tryStatement') {
        return makeTryStatementJson(statement);
    } else if (statement.type === 'undeleteStatement') {
        return makeUndeleteStatementJson(statement);
    } else if (statement.type === 'updateStatement') {
        return makeUpdateStatementJson(statement);
    } else if (statement.type === 'upsertStatement') {
        return makeUpsertStatementJson(statement);
    } else if (statement.type === 'whileStatement') {
        return makeWhileStatementJson(statement);
    } else {
        return statement.value.map((v) => makeStatementJson(v));
    }
};

// ブロック自体がエラーノードの場合は、その位置に ErrorJson を1件置く
export const makeBlockJson = (target: ConvertType<BlockType>): (StatementJson | ErrorJson)[] => {
    if (isErrorNode(target)) {
        return [makeErrorJson(target, ERROR_KIND)];
    }

    return target.value.map((s) => makeStatementJson(s));
};
