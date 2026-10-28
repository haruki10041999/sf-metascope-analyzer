import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
    ConvertType,
    convertValue,
    ErrorJson,
    JsonType,
    makeJsonType,
} from './commons';

import {
    AccessLevelType,
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
} from './converter';
import { BaseExpressionJson, makeExpressionJsonConvert } from './expression';
import { TypeJson, makeTypeJson } from './type';
import { LocalVariableDeclarationJson, makeLocalVariableDeclarationJson } from './declaration';
import { ModifiersJson } from './modifier';

const makeAccessLevelJson = (target: ConvertExcludeError<AccessLevelType>): 'SYSTEM' | 'USER' => {
    return target.value;
};

export type BreakStatementJson = JsonType<'break'> & {
    value: string;
};
export const isBreakStatementJson = typia.createIs<BreakStatementJson>();

export const makeBreakStatementJson = (
    target: ConvertExcludeError<BreakStatementType>,
): BreakStatementJson => {
    return makeJsonType(
        'break',
        {},
        {
            value: target.value,
        },
    );
};

export type ContinueStatementJson = JsonType<'continue'> & {
    value: string;
};
export const isContinueStatementJson = typia.createIs<ContinueStatementJson>();

export const makeContinueStatementJson = (
    target: ConvertExcludeError<ContinueStatementType>,
): ContinueStatementJson => {
    return makeJsonType(
        'continue',
        {},
        {
            value: target.value,
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
    targetRecords?: Record<string, string[]>,
): DeleteStatementJson | ErrorJson => {
    return convertValue<'deleteStatement', DeleteStatementType, DeleteStatementJson>(
        ['deleteStatement'],
        target,
        'delete',
        (target, targetRecords) => {
            return makeJsonType('delete', targetRecords, {
                field: makeExpressionJsonConvert(target.value),
                ...(target.accessLevel
                    ? { accessLevel: makeAccessLevelJson(target.accessLevel) }
                    : {}),
            });
        },
        targetRecords,
    );
};

export type DoWhileConditionJson = JsonType<'doWhileConditionJson'> & {
    condition: BaseExpressionJson | ErrorJson;
};
export const isDoWhileConditionJson = typia.createIs<DoWhileConditionJson>();

const makeDoWhileConditionJson = (
    target: ConvertType<ParExpressionType>,
    targetRecords?: Record<string, string[]>,
): DoWhileConditionJson | ErrorJson => {
    return convertValue<'parExpression', ParExpressionType, DoWhileConditionJson>(
        ['parExpression'],
        target,
        'statementCondition',
        (target, targetRecords) => {
            return makeJsonType('doWhileConditionJson', targetRecords, {
                condition: makeExpressionJsonConvert(target.value),
            });
        },
        targetRecords,
    );
};

export type DoWhileStatementJson = {
    type: 'doWhileStatement';
    condition: DoWhileConditionJson | ErrorJson;
    body: (BaseStatementJson | ErrorJson)[];
};
export const isDoWhileStatementJson = typia.createIs<DoWhileStatementJson>();

const makeDoWhileStatementJson = (
    target: ConvertExcludeError<DoWhileStatementType>,
): DoWhileStatementJson => {
    return {
        type: 'doWhileStatement',
        condition: makeDoWhileConditionJson(target.value),
        body: target.block.value.map((b) => makeStatementJson(b)),
    };
};

export type ExpressionStatementJson = JsonType<'expression'> & {
    value: BaseExpressionJson | ErrorJson;
};

export const isExpressionStatementJson = typia.createIs<ExpressionStatementJson>();

const makeExpressionStatementJson = (
    target: ConvertType<ExpressionStatementType>,
    targetRecords?: Record<string, string[]>,
): ExpressionStatementJson | ErrorJson => {
    return convertValue<'expressionStatement', ExpressionStatementType, ExpressionStatementJson>(
        ['expressionStatement'],
        target,
        'expression',
        (target, targetRecords) => {
            return makeJsonType('expression', targetRecords, {
                value: makeExpressionJsonConvert(target.value),
            });
        },
        targetRecords,
    );
};

export type ForConditionJson = JsonType<'forCondition'> &
    (
        | {
              initializer: string;
              initializeType: Omit<TypeJson, 'kind' | 'sourceKeys'> | ErrorJson;
              baseObject: BaseExpressionJson | ErrorJson;
          }
        | {
              initializer: LocalVariableDeclarationJson | (BaseExpressionJson | ErrorJson)[];
              condition: BaseExpressionJson | ErrorJson;
              update: (BaseExpressionJson | ErrorJson)[];
          }
        | {}
    );

export const isForConditionJson = typia.createIs<ForConditionJson>();

const makeForConditionJson = (
    target: ConvertType<ForControlType>,
    targetRecords?: Record<string, string[]>,
): ForConditionJson | ErrorJson => {
    return convertValue<'forControl', ForControlType, ForConditionJson>(
        ['forControl'],
        target,
        'forCondition',
        (target, targetRecords) => {
            if (target.value) {
                if (target.value.type === 'enhancedForControl') {
                    return makeJsonType('forCondition', targetRecords, {
                        initializer: target.value.value.value,
                        initializeType: makeTypeJson(target.value.valueType),
                        baseObject: makeExpressionJsonConvert(target.value.fromVariant),
                    });
                } else {
                    const initializer =
                        target.init!.value.type === 'localVariableDeclaration'
                            ? makeLocalVariableDeclarationJson(target.init!.value)
                            : target.init!.value.value.map((v) => makeExpressionJsonConvert(v));

                    return makeJsonType('forCondition', targetRecords, {
                        initializer: initializer,
                        condition: makeExpressionJsonConvert(target.value),
                        update: target.update!.value.value.map(makeExpressionJsonConvert),
                    });
                }
            } else {
                return makeJsonType('forCondition', targetRecords, {});
            }
        },
        targetRecords,
    );
};

type ForStatementJson = {
    type: 'forStatement';
    condition: ForConditionJson | ErrorJson;
    block: BaseStatementJson | ErrorJson;
};

export const isForStatementJson = typia.createIs<ForStatementJson>();

const makeForStatementJson = (target: ConvertExcludeError<ForStatementType>): ForStatementJson => {
    return {
        type: 'forStatement',
        condition: makeForConditionJson(target.value),
        block: makeStatementJson(target.block),
    };
};

export type IfConditionJson = JsonType<'ifConditionJson'> & {
    condition: 'else' | BaseExpressionJson | ErrorJson;
};
export const IfConditionJson = typia.createIs<IfConditionJson>();

const makeIfConditionJson = (
    target: ConvertType<ParExpressionType> | 'else',
    targetRecords?: Record<string, string[]>,
): IfConditionJson | ErrorJson => {
    if (typeof target === 'string') {
        return makeJsonType('ifConditionJson', targetRecords ?? {}, {
            condition: target,
        });
    }
    return convertValue<'parExpression', ParExpressionType, IfConditionJson>(
        ['parExpression'],
        target,
        'statementCondition',
        (target, targetRecords) => {
            return makeJsonType('ifConditionJson', targetRecords, {
                condition: makeExpressionJsonConvert(target.value),
            });
        },
        targetRecords,
    );
};

type IfStatementJson = {
    type: 'ifStatement';
    conditionBlock: {
        condition: IfConditionJson | ErrorJson;
        block: BaseStatementJson | ErrorJson;
    }[];
};

export const isIfStatementJson = typia.createIs<IfStatementJson>();

const makeIfStatementJson = (target: ConvertExcludeError<IfStatementType>): IfStatementJson => {
    return {
        type: 'ifStatement',
        conditionBlock: target.value.map((block) => {
            const condition =
                typeof block.condition === 'string'
                    ? makeIfConditionJson(block.condition, {
                          [target.objectKey]: [target.sourceKey],
                      })
                    : makeIfConditionJson(block.condition);
            return {
                condition: condition,
                block: makeStatementJson(block.block),
            };
        }),
    };
};

type InsertStatementJson = JsonType<'insert'> & {
    field: BaseExpressionJson | ErrorJson;
    accessLevel?: 'SYSTEM' | 'USER';
};
export const isInsertStatementJson = typia.createIs<InsertStatementJson>();

export const makeInsertStatementJson = (
    target: ConvertType<InsertStatementType>,
    targetRecords?: Record<string, string[]>,
): InsertStatementJson | ErrorJson => {
    return convertValue<'insertStatement', InsertStatementType, InsertStatementJson>(
        ['insertStatement'],
        target,
        'insert',
        (target, targetRecords) => {
            return makeJsonType('insert', targetRecords, {
                field: makeExpressionJsonConvert(target.value),
                ...(target.accessLevel
                    ? { accessLevel: makeAccessLevelJson(target.accessLevel) }
                    : {}),
            });
        },
        targetRecords,
    );
};

type LocalVariableStatementJson = JsonType<'localVariable'> & {
    variable: LocalVariableDeclarationJson;
};
export const isLocalVariableStatementJson = typia.createIs<LocalVariableStatementJson>();

export const makeLocalVariableStatementJson = (
    target: ConvertType<LocalVariableDeclarationStatementType>,
    targetRecords?: Record<string, string[]>,
): LocalVariableStatementJson | ErrorJson => {
    return convertValue<
        'localVariableDeclarationStatement',
        LocalVariableDeclarationStatementType,
        LocalVariableStatementJson
    >(
        ['localVariableDeclarationStatement'],
        target,
        'localVariable',
        (target, targetRecords) => {
            return makeJsonType('localVariable', targetRecords, {
                variable: makeLocalVariableDeclarationJson(target.value),
            });
        },
        targetRecords,
    );
};

type MergeStatementJson = JsonType<'merge'> & {
    field: (BaseExpressionJson | ErrorJson)[];
    accessLevel?: 'SYSTEM' | 'USER';
};
export const isMergeStatementJson = typia.createIs<MergeStatementJson>();

export const makeMergeStatementJson = (
    target: ConvertType<MergeStatementType>,
    targetRecords?: Record<string, string[]>,
): MergeStatementJson | ErrorJson => {
    return convertValue<'mergeStatement', MergeStatementType, MergeStatementJson>(
        ['mergeStatement'],
        target,
        'merge',
        (target, targetRecords) => {
            return makeJsonType('merge', targetRecords, {
                field: target.value.map((v) => makeExpressionJsonConvert(v)),
                ...(target.accessLevel
                    ? { accessLevel: makeAccessLevelJson(target.accessLevel) }
                    : {}),
            });
        },
        targetRecords,
    );
};

type ReturnStatementJson = JsonType<'return'> & {
    field?: BaseExpressionJson | ErrorJson;
};
export const isReturnStatementJson = typia.createIs<ReturnStatementJson>();

export const makeReturnStatementJson = (
    target: ConvertType<ReturnStatementType>,
    targetRecords?: Record<string, string[]>,
): ReturnStatementJson | ErrorJson => {
    return convertValue<'returnStatement', ReturnStatementType, ReturnStatementJson>(
        ['returnStatement'],
        target,
        'return',
        (target, targetRecords) => {
            return makeJsonType('return', targetRecords, {
                ...(target.value ? { field: makeExpressionJsonConvert(target.value) } : {}),
            });
        },
        targetRecords,
    );
};

type RunAsConditionJson = JsonType<'runAsCondition'> & {
    field: (BaseExpressionJson | ErrorJson)[];
};
export const isRunAsConditionJson = typia.createIs<RunAsConditionJson>();

const makeRunAsConditionJson = (
    target: ConvertType<ExpressionListType>,
    targetRecords?: Record<string, string[]>,
): RunAsConditionJson | ErrorJson => {
    return convertValue<'expressionList', ExpressionListType, RunAsConditionJson>(
        ['expressionList'],
        target,
        'runAsCondition',
        (target, targetRecords) => {
            return makeJsonType('runAsCondition', targetRecords, {
                field: target.value.map((v) => makeExpressionJsonConvert(v)),
            });
        },
        targetRecords,
    );
};

type RunAsStatementJson = {
    type: 'runAsStatement';
    condition: ErrorJson | RunAsConditionJson;
    block: (BaseStatementJson | ErrorJson)[];
};

export const isRunAsStatementJson = typia.createIs<RunAsStatementJson>();

export const makeRunAsStatementJson = (
    target: ConvertExcludeError<RunAsStatementType>,
): RunAsStatementJson => {
    return {
        type: 'runAsStatement',
        condition: makeRunAsConditionJson(target.value),
        block: target.block.value.map((v) => makeStatementJson(v)),
    };
};

type WhenVariantJson = JsonType<'whenVariant'> & {
    variant: BaseExpressionJson | ErrorJson;
};

export const isWhenVariantJson = typia.createIs<WhenVariantJson>();

export const makeWhenVariantJson = (
    target: ConvertType<BaseExpressionType>,
    targetRecords?: Record<string, string[]>,
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
    >(
        [
            'expression',
            'primaryExpression',
            'dotExpression',
            'methodCallExpression',
            'newExpression',
            'castExpression',
            'subExpression',
            'arrayExpression',
            'arth1Expression',
            'arth2Expression',
            'assignExpression',
            'bitAndExpression',
            'bitExpression',
            'bitOrExpression',
            'bitNotExpression',
            'cmpExpression',
            'coalExpression',
            'condExpression',
            'equalityExpression',
            'instanceOfExpression',
            'logAndExpression',
            'logOrExpression',
            'negExpression',
            'postOpExpression',
            'preOpExpression',
        ],
        target,
        'whenVariant',
        (target, targetRecords) => {
            return makeJsonType('whenVariant', targetRecords, {
                variant: makeExpressionJsonConvert(target),
            });
        },
        targetRecords,
    );
};

type WhenConditionJson = JsonType<'whenCondition'> & {
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
    targetRecords?: Record<string, string[]>,
): WhenConditionJson | ErrorJson => {
    return convertValue<'whenValue', WhenValueType, WhenConditionJson>(
        ['whenValue'],
        target,
        'whenCondition',
        (target, targetRecords) => {
            if (typeof target.value === 'string') {
                return makeJsonType('whenCondition', targetRecords, { condition: 'else' });
            } else if (Array.isArray(target.value)) {
                return makeJsonType('whenCondition', targetRecords, {
                    condition: target.value.map((v) => {
                        if (
                            v.valueType === 'string' ||
                            v.valueType === 'longText' ||
                            v.valueType === 'null'
                        ) {
                            return {
                                value: v.value,
                                valueType: v.valueType,
                            };
                        } else if (v.valueType === 'integer' || v.valueType === 'long') {
                            return {
                                value: v.value,
                                valueType: v.valueType,
                                ...(v.operator ? { operator: v.operator } : {}),
                            };
                        } else if (v.valueType === 'id') {
                            return {
                                value: v.value.value.map((part) => part.value),
                                valueType: v.valueType,
                            };
                        }

                        throw new Error(`Unsupported when literal type: ${v.valueType}`);
                    }),
                });
            } else if ('valueType' in target) {
                return makeJsonType('whenCondition', targetRecords, {
                    condition: {
                        value: target.value.value,
                        valueType: makeTypeJson(target.valueType),
                    },
                });
            } else {
                throw new Error('Unsupported when value variant');
            }
        },
        targetRecords,
    );
};

type SwitchStatementJson = {
    type: 'switchStatement';
    variant: WhenVariantJson | ErrorJson;
    block: {
        condition: WhenConditionJson | ErrorJson;
        block: (BaseStatementJson | ErrorJson)[];
    }[];
};

export const isSwitchStatementJson = typia.createIs<SwitchStatementJson>();

const makeSwitchStatementJson = (
    target: ConvertExcludeError<SwitchStatementType>,
): SwitchStatementJson => {
    return {
        type: 'switchStatement',
        variant: makeWhenVariantJson(target.value),
        block: target.block.map((b) => {
            return {
                condition: makeWhenConditionJson(b.value),
                block: b.block.value.map((b) => makeStatementJson(b)),
            };
        }),
    };
};

type ThrowStatementJson = JsonType<'throw'> & {
    value: BaseExpressionJson | ErrorJson;
};

export const isThrowStatementJson = typia.createIs<ThrowStatementJson>();

export const makeThrowStatementJson = (
    target: ConvertType<ThrowStatementType>,
    targetRecords?: Record<string, string[]>,
): ThrowStatementJson | ErrorJson => {
    return convertValue<'throwStatement', ThrowStatementType, ThrowStatementJson>(
        ['throwStatement'],
        target,
        'throw',
        (target, targetRecords) => {
            return makeJsonType('throw', targetRecords, {
                value: makeExpressionJsonConvert(target.value),
            });
        },
        targetRecords,
    );
};

type TryConditionJson = JsonType<'tryCondition'> &
    (
        | { value: 'try' | 'finally' }
        | {
              exception: string;
              exceptionType: string[];
              modifier: ModifiersJson;
          }
    );

export type BaseStatementJson =
    | (BaseStatementJson | ErrorJson)[]
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
    | ThrowStatementJson;

export const makeStatementJson = (
    target: ConvertExcludeError<StatementType>,
): BaseStatementJson | ErrorJson => {
    if (target.value.type === 'block') {
        return target.value.value.map((v) => makeStatementJson(v));
    }

    if (target.value.type === 'breakStatement') {
        return makeBreakStatementJson(target.value);
    } else if (target.value.type === 'continueStatement') {
        return makeContinueStatementJson(target.value);
    } else if (target.value.type === 'deleteStatement') {
        return makeDeleteStatementJson(target.value);
    } else if (target.value.type === 'doWhileStatement') {
        return makeDoWhileStatementJson(target.value);
    } else if (target.value.type === 'expressionStatement') {
        return makeExpressionStatementJson(target.value);
    } else if (target.value.type === 'forStatement') {
        return makeForStatementJson(target.value);
    } else if (target.value.type === 'ifStatement') {
        return makeIfStatementJson(target.value);
    } else if (target.value.type === 'insertStatement') {
        return makeInsertStatementJson(target.value);
    } else if (target.value.type === 'localVariableDeclarationStatement') {
        return makeLocalVariableStatementJson(target.value);
    } else if (target.value.type === 'mergeStatement') {
        return makeMergeStatementJson(target.value);
    } else if (target.value.type === 'returnStatement') {
        return makeReturnStatementJson(target.value);
    } else if (target.value.type === 'runAsStatement') {
        return makeRunAsStatementJson(target.value);
    } else if (target.value.type === 'switchStatement') {
        return makeSwitchStatementJson(target.value);
    } else if (target.value.type === 'throwStatement') {
        return makeThrowStatementJson(target.value);
    }
};
