import typia from 'typia';

import { ErrorJson, JsonType, StructureJsonType, makeStructureJson, ConvertKeys } from '../commons';
import type {
    AccessLevelTypeClass,
    BasedExpressionTypeClass,
    BlockTypeClass,
    BreakStatementTypeClass,
    CatchClauseTypeClass,
    ContinueStatementTypeClass,
    DeleteStatementTypeClass,
    DoWhileStatementTypeClass,
    ExpressionListTypeClass,
    ExpressionStatementTypeClass,
    ForControlTypeClass,
    ForStatementTypeClass,
    IfStatementTypeClass,
    InsertStatementTypeClass,
    LocalVariableDeclarationStatementTypeClass,
    MergeStatementTypeClass,
    ParExpressionTypeClass,
    ReturnStatementTypeClass,
    RunAsStatementTypeClass,
    StatementTypeClass,
    SwitchStatementTypeClass,
    ThrowStatementTypeClass,
    TryStatementTypeClass,
    UndeleteStatementTypeClass,
    UpdateStatementTypeClass,
    UpsertStatementTypeClass,
    WhenLiteralTypeClass,
    WhenValueTypeClass,
    WhileStatementTypeClass,
} from '../apex_IR_v2';

import { keysOf, makeNodeJson, structureKeysOf } from './commons/node';
import { BaseExpressionJson, makeExpressionJsonConvert } from './expression';
import { TypeJson, makeTypeJson } from './type';
import { LocalVariableDeclarationJson, makeLocalVariableDeclarationJson } from './declaration';
import { makeModifierJson, ModifierJson, AnnotationJson } from './modifier';

const makeAccessLevelJson = (target: AccessLevelTypeClass): 'SYSTEM' | 'USER' => {
    return target.getFields().level;
};

// accessLevel はあるときだけ持つ
const accessLevelOf = (
    accessLevel: AccessLevelTypeClass | null,
): { accessLevel?: 'SYSTEM' | 'USER' } => {
    return accessLevel ? { accessLevel: makeAccessLevelJson(accessLevel) } : {};
};

export type BreakStatementJson = JsonType<'break'> & {
    value: string;
};
export const isBreakStatementJson = typia.createIs<BreakStatementJson>();

export const makeBreakStatementJson = (target: BreakStatementTypeClass): BreakStatementJson => {
    return makeNodeJson<BreakStatementJson>('break', target, {
        value: target.getFields().value,
    });
};

export type ContinueStatementJson = JsonType<'continue'> & {
    value: string;
};
export const isContinueStatementJson = typia.createIs<ContinueStatementJson>();

export const makeContinueStatementJson = (
    target: ContinueStatementTypeClass,
): ContinueStatementJson => {
    return makeNodeJson<ContinueStatementJson>('continue', target, {
        value: target.getFields().value,
    });
};

export type DeleteStatementJson = JsonType<'delete'> & {
    field: BaseExpressionJson | ErrorJson;
    accessLevel?: 'SYSTEM' | 'USER';
};
export const isDeleteStatementJson = typia.createIs<DeleteStatementJson>();

export const makeDeleteStatementJson = (target: DeleteStatementTypeClass): DeleteStatementJson => {
    const { value, accessLevel } = target.getFields();
    return makeNodeJson<DeleteStatementJson>('delete', target, {
        field: makeExpressionJsonConvert(value),
        ...accessLevelOf(accessLevel),
    });
};

export type DoWhileConditionJson = JsonType<'doWhileCondition'> & {
    condition: BaseExpressionJson | ErrorJson;
};
export const isDoWhileConditionJson = typia.createIs<DoWhileConditionJson>();

const makeDoWhileConditionJson = (target: ParExpressionTypeClass): DoWhileConditionJson => {
    return makeNodeJson<DoWhileConditionJson>('doWhileCondition', target, {
        condition: makeExpressionJsonConvert(target.getFields().value),
    });
};

// 複合文は文全体の位置を持つ境界ノード
export type DoWhileStatementJson = JsonType<'doWhile'> & {
    condition: DoWhileConditionJson | ErrorJson;
    body: (StatementJson | ErrorJson)[];
};
export const isDoWhileStatementJson = typia.createIs<DoWhileStatementJson>();

const makeDoWhileStatementJson = (target: DoWhileStatementTypeClass): DoWhileStatementJson => {
    const { value, block } = target.getFields();
    return makeNodeJson<DoWhileStatementJson>('doWhile', target, {
        condition: makeDoWhileConditionJson(value),
        body: makeBlockJson(block),
    });
};

export type ExpressionStatementJson = JsonType<'expression'> & {
    value: BaseExpressionJson | ErrorJson;
};

export const isExpressionStatementJson = typia.createIs<ExpressionStatementJson>();

const makeExpressionStatementJson = (
    target: ExpressionStatementTypeClass,
): ExpressionStatementJson => {
    return makeNodeJson<ExpressionStatementJson>('expression', target, {
        value: makeExpressionJsonConvert(target.getFields().value),
    });
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

const makeForConditionJson = (target: ForControlTypeClass): ForConditionJson => {
    const control = target.getFields();
    if (control.kind === 'enhanced') {
        const { value, valueType, fromVariant } = control.control.getFields();
        return makeNodeJson<ForConditionJson>('forCondition', target, {
            initializer: value.getFields().value,
            initializeType: makeTypeJson(valueType),
            baseObject: makeExpressionJsonConvert(fromVariant),
        });
    }

    // for (;;) の init / 条件 / update はそれぞれ省略されうる
    const { init, condition, update } = control;
    const initValue = init?.getFields().value;
    const initializer = initValue
        ? initValue.kind === 'localVariableDeclaration'
            ? makeLocalVariableDeclarationJson(initValue)
            : initValue.getFields().value.map((v) => makeExpressionJsonConvert(v))
        : null;

    return makeNodeJson<ForConditionJson>('forCondition', target, {
        ...(initializer ? { initializer: initializer } : {}),
        ...(condition ? { condition: makeExpressionJsonConvert(condition) } : {}),
        ...(update
            ? {
                  update: update
                      .getFields()
                      .value.getFields()
                      .value.map((v) => makeExpressionJsonConvert(v)),
              }
            : {}),
    });
};

export type ForStatementJson = JsonType<'for'> & {
    condition: ForConditionJson | ErrorJson;
    block: StatementJson | ErrorJson;
};

export const isForStatementJson = typia.createIs<ForStatementJson>();

const makeForStatementJson = (target: ForStatementTypeClass): ForStatementJson => {
    const { value, block } = target.getFields();
    return makeNodeJson<ForStatementJson>('for', target, {
        condition: makeForConditionJson(value),
        block: makeStatementJson(block),
    });
};

export type IfConditionJson = JsonType<'ifCondition'> & {
    condition: BaseExpressionJson | ErrorJson;
};
export const isIfConditionJson = typia.createIs<IfConditionJson>();

const makeIfConditionJson = (target: ParExpressionTypeClass): IfConditionJson => {
    return makeNodeJson<IfConditionJson>('ifCondition', target, {
        condition: makeExpressionJsonConvert(target.getFields().value),
    });
};

export type IfStatementJson = JsonType<'if'> & {
    conditionBlock:
        | {
              condition: 'else' | IfConditionJson | ErrorJson;
              block: StatementJson | ErrorJson;
          }[]
        | ErrorJson;
};

export const isIfStatementJson = typia.createIs<IfStatementJson>();

const makeIfStatementJson = (target: IfStatementTypeClass): IfStatementJson => {
    const { branches, elseBlock } = target.getFields();
    // if・else if の分岐のあとに、else があれば condition: 'else' として最後に置く
    const conditionBlock: {
        condition: 'else' | IfConditionJson;
        block: StatementJson;
    }[] = branches.map((branch) => ({
        condition: makeIfConditionJson(branch.condition),
        block: makeStatementJson(branch.block),
    }));
    if (elseBlock) {
        conditionBlock.push({ condition: 'else', block: makeStatementJson(elseBlock) });
    }
    return makeNodeJson<IfStatementJson>('if', target, { conditionBlock });
};

export type InsertStatementJson = JsonType<'insert'> & {
    field: BaseExpressionJson | ErrorJson;
    accessLevel?: 'SYSTEM' | 'USER';
};
export const isInsertStatementJson = typia.createIs<InsertStatementJson>();

export const makeInsertStatementJson = (target: InsertStatementTypeClass): InsertStatementJson => {
    const { value, accessLevel } = target.getFields();
    return makeNodeJson<InsertStatementJson>('insert', target, {
        field: makeExpressionJsonConvert(value),
        ...accessLevelOf(accessLevel),
    });
};

export type LocalVariableStatementJson = JsonType<'localVariable'> & {
    variable: LocalVariableDeclarationJson;
};
export const isLocalVariableStatementJson = typia.createIs<LocalVariableStatementJson>();

export const makeLocalVariableStatementJson = (
    target: LocalVariableDeclarationStatementTypeClass,
): LocalVariableStatementJson => {
    return makeNodeJson<LocalVariableStatementJson>('localVariable', target, {
        variable: makeLocalVariableDeclarationJson(target.getFields().value),
    });
};

export type MergeStatementJson = JsonType<'merge'> & {
    field: (BaseExpressionJson | ErrorJson)[];
    accessLevel?: 'SYSTEM' | 'USER';
};
export const isMergeStatementJson = typia.createIs<MergeStatementJson>();

export const makeMergeStatementJson = (target: MergeStatementTypeClass): MergeStatementJson => {
    const { master, merged, accessLevel } = target.getFields();
    // field は [統合先, 統合元] の順
    return makeNodeJson<MergeStatementJson>('merge', target, {
        field: [makeExpressionJsonConvert(master), makeExpressionJsonConvert(merged)],
        ...accessLevelOf(accessLevel),
    });
};

export type ReturnStatementJson = JsonType<'return'> & {
    field?: BaseExpressionJson | ErrorJson;
};
export const isReturnStatementJson = typia.createIs<ReturnStatementJson>();

export const makeReturnStatementJson = (target: ReturnStatementTypeClass): ReturnStatementJson => {
    const { value } = target.getFields();
    return makeNodeJson<ReturnStatementJson>('return', target, {
        ...(value ? { field: makeExpressionJsonConvert(value) } : {}),
    });
};

export type RunAsConditionJson = JsonType<'runAsCondition'> & {
    field: (BaseExpressionJson | ErrorJson)[];
};
export const isRunAsConditionJson = typia.createIs<RunAsConditionJson>();

const makeRunAsConditionJson = (
    target: ExpressionListTypeClass | null,
    statement: RunAsStatementTypeClass,
): RunAsConditionJson => {
    // `System.runAs()` (引数なし) は v2 では value が null。キーは runAs 文のものを使い、field は空にする
    if (!target) {
        return makeNodeJson<RunAsConditionJson>('runAsCondition', statement, { field: [] });
    }
    return makeNodeJson<RunAsConditionJson>('runAsCondition', target, {
        field: target.getFields().value.map((v) => makeExpressionJsonConvert(v)),
    });
};

export type RunAsStatementJson = JsonType<'runAs'> & {
    condition: ErrorJson | RunAsConditionJson;
    block: (StatementJson | ErrorJson)[];
};

export const isRunAsStatementJson = typia.createIs<RunAsStatementJson>();

export const makeRunAsStatementJson = (target: RunAsStatementTypeClass): RunAsStatementJson => {
    const { value, block } = target.getFields();
    return makeNodeJson<RunAsStatementJson>('runAs', target, {
        condition: makeRunAsConditionJson(value, target),
        block: makeBlockJson(block),
    });
};

export type WhenVariantJson = JsonType<'switchVariant'> & {
    variant: BaseExpressionJson | ErrorJson;
};

export const isWhenVariantJson = typia.createIs<WhenVariantJson>();

// switch の対象の式。キーは式のノード自身のもの
export const makeWhenVariantJson = (target: BasedExpressionTypeClass): WhenVariantJson => {
    return makeNodeJson<WhenVariantJson>('switchVariant', target, {
        variant: makeExpressionJsonConvert(target),
    });
};

export type WhenConditionJson = JsonType<'switchCondition'> & {
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

const makeWhenLiteralJson = (
    target: WhenLiteralTypeClass,
): Exclude<
    WhenConditionJson['condition'],
    'else' | { valueType: TypeJson | ErrorJson }
>[number] => {
    const literal = target.getFields();
    switch (literal.kind) {
        case 'id':
            return {
                value: literal.value.getFields().value.map((part) => part.getFields().value),
                valueType: literal.kind,
            };
        case 'integer':
        case 'long':
            // 符号は並んだ順につないだ文字列にする (符号がなければ持たない)
            return {
                value: literal.value,
                valueType: literal.kind,
                ...(literal.signs.length > 0 ? { operator: literal.signs.join('') } : {}),
            };
        case 'string':
        case 'longText':
            return { value: literal.value, valueType: literal.kind };
        case 'null':
            // キーワードは大文字・小文字を区別しないので、'null' にそろえる (docs/ir-v2-integration.md 4 章)
            return { value: 'null', valueType: literal.kind };
    }
};

export const makeWhenConditionJson = (target: WhenValueTypeClass): WhenConditionJson => {
    const when = target.getFields();
    switch (when.kind) {
        case 'type':
            return makeNodeJson<WhenConditionJson>('switchCondition', target, {
                condition: {
                    value: when.variable.getFields().value,
                    valueType: makeTypeJson(when.typeRef),
                },
            });
        case 'else':
            return makeNodeJson<WhenConditionJson>('switchCondition', target, {
                condition: 'else',
            });
        case 'literals':
            return makeNodeJson<WhenConditionJson>('switchCondition', target, {
                condition: when.values.map(makeWhenLiteralJson),
            });
    }
};

export type SwitchStatementJson = JsonType<'switch'> & {
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

const makeSwitchStatementJson = (target: SwitchStatementTypeClass): SwitchStatementJson => {
    const { value, blocks } = target.getFields();
    return makeNodeJson<SwitchStatementJson>('switch', target, {
        variant: makeWhenVariantJson(value),
        block: blocks.map((b) => {
            const when = b.getFields();
            return {
                condition: makeWhenConditionJson(when.value),
                block: makeBlockJson(when.block),
            };
        }),
    });
};

export type ThrowStatementJson = JsonType<'throw'> & {
    value: BaseExpressionJson | ErrorJson;
};

export const isThrowStatementJson = typia.createIs<ThrowStatementJson>();

export const makeThrowStatementJson = (target: ThrowStatementTypeClass): ThrowStatementJson => {
    return makeNodeJson<ThrowStatementJson>('throw', target, {
        value: makeExpressionJsonConvert(target.getFields().value),
    });
};

export type CatchConditionJson = StructureJsonType<
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

// catch 本体の文は makeTryBlocksJson 側で処理する
const makeCatchConditionJson = (target: CatchClauseTypeClass): CatchConditionJson => {
    const { value, valueType, modifier } = target.getFields();
    return makeStructureJson(
        'catchCondition',
        structureKeysOf<{ exception: ConvertKeys; exceptionType: ConvertKeys }>(target, {
            exception: value,
            exceptionType: valueType,
        }),
        {
            exception: value.getFields().value,
            exceptionType: valueType.getFields().value.map((v) => v.getFields().value),
            modifier: modifier.map((m) => makeModifierJson(m)),
        },
    );
};

export type TryStatementJson = JsonType<'try'> & {
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

const makeTryBlocksJson = (target: TryStatementTypeClass): TryStatementJson['block'] => {
    const { block, catchClauses, finallyBlock } = target.getFields();
    const tryBlock: { condition: 'try'; block: StatementJson[] } = {
        condition: 'try',
        block: makeBlockJson(block),
    };
    const catchBlocks = catchClauses.map(
        (
            b: CatchClauseTypeClass,
        ): {
            condition: 'catch';
            catchCondition: CatchConditionJson;
            block: StatementJson[];
        } => ({
            condition: 'catch',
            catchCondition: makeCatchConditionJson(b),
            block: makeBlockJson(b.getFields().block),
        }),
    );
    const finallyJson: { condition: 'finally'; block: StatementJson[] } | null = finallyBlock
        ? { condition: 'finally', block: makeBlockJson(finallyBlock.getFields().block) }
        : null;

    return [tryBlock, ...catchBlocks, ...(finallyJson ? [finallyJson] : [])];
};

const makeTryStatementJson = (target: TryStatementTypeClass): TryStatementJson => {
    return makeNodeJson<TryStatementJson>('try', target, {
        block: makeTryBlocksJson(target),
    });
};

export type UndeleteStatementJson = JsonType<'undelete'> & {
    field: BaseExpressionJson | ErrorJson;
    accessLevel?: 'SYSTEM' | 'USER';
};
export const isUndeleteStatementJson = typia.createIs<UndeleteStatementJson>();

export const makeUndeleteStatementJson = (
    target: UndeleteStatementTypeClass,
): UndeleteStatementJson => {
    const { value, accessLevel } = target.getFields();
    return makeNodeJson<UndeleteStatementJson>('undelete', target, {
        field: makeExpressionJsonConvert(value),
        ...accessLevelOf(accessLevel),
    });
};

export type UpdateStatementJson = JsonType<'update'> & {
    field: BaseExpressionJson | ErrorJson;
    accessLevel?: 'SYSTEM' | 'USER';
};
export const isUpdateStatementJson = typia.createIs<UpdateStatementJson>();

export const makeUpdateStatementJson = (target: UpdateStatementTypeClass): UpdateStatementJson => {
    const { value, accessLevel } = target.getFields();
    return makeNodeJson<UpdateStatementJson>('update', target, {
        field: makeExpressionJsonConvert(value),
        ...accessLevelOf(accessLevel),
    });
};

export type UpsertStatementJson = JsonType<'upsert'> & {
    field: BaseExpressionJson | ErrorJson;
    accessLevel?: 'SYSTEM' | 'USER';
    key?: string[];
};
export const isUpsertStatementJson = typia.createIs<UpsertStatementJson>();

export const makeUpsertStatementJson = (target: UpsertStatementTypeClass): UpsertStatementJson => {
    const { value, accessLevel, key } = target.getFields();
    return makeNodeJson<UpsertStatementJson>('upsert', target, {
        field: makeExpressionJsonConvert(value),
        ...accessLevelOf(accessLevel),
        ...(key ? { key: key.getFields().value.map((v) => v.getFields().value) } : {}),
    });
};

export type WhileConditionJson = JsonType<'whileCondition'> & {
    condition: BaseExpressionJson | ErrorJson;
};
export const isWhileConditionJson = typia.createIs<WhileConditionJson>();

const makeWhileConditionJson = (target: ParExpressionTypeClass): WhileConditionJson => {
    return makeNodeJson<WhileConditionJson>('whileCondition', target, {
        condition: makeExpressionJsonConvert(target.getFields().value),
    });
};

export type WhileStatementJson = JsonType<'while'> & {
    condition: WhileConditionJson | ErrorJson;
    body: StatementJson | ErrorJson;
};
export const isWhileStatementJson = typia.createIs<WhileStatementJson>();

const makeWhileStatementJson = (target: WhileStatementTypeClass): WhileStatementJson => {
    const { value, block } = target.getFields();
    return makeNodeJson<WhileStatementJson>('while', target, {
        condition: makeWhileConditionJson(value),
        body: makeStatementJson(block),
    });
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

// statement は中の文だけを JSON にする (statement 自身のキーは使わない)。ブロックは文の配列になる
export const makeStatementJson = (target: StatementTypeClass): StatementJson => {
    const statement = target.getFields().statement;
    switch (statement.kind) {
        case 'breakStatement':
            return makeBreakStatementJson(statement);
        case 'continueStatement':
            return makeContinueStatementJson(statement);
        case 'deleteStatement':
            return makeDeleteStatementJson(statement);
        case 'doWhileStatement':
            return makeDoWhileStatementJson(statement);
        case 'expressionStatement':
            return makeExpressionStatementJson(statement);
        case 'forStatement':
            return makeForStatementJson(statement);
        case 'ifStatement':
            return makeIfStatementJson(statement);
        case 'insertStatement':
            return makeInsertStatementJson(statement);
        case 'localVariableDeclarationStatement':
            return makeLocalVariableStatementJson(statement);
        case 'mergeStatement':
            return makeMergeStatementJson(statement);
        case 'returnStatement':
            return makeReturnStatementJson(statement);
        case 'runAsStatement':
            return makeRunAsStatementJson(statement);
        case 'switchStatement':
            return makeSwitchStatementJson(statement);
        case 'throwStatement':
            return makeThrowStatementJson(statement);
        case 'tryStatement':
            return makeTryStatementJson(statement);
        case 'undeleteStatement':
            return makeUndeleteStatementJson(statement);
        case 'updateStatement':
            return makeUpdateStatementJson(statement);
        case 'upsertStatement':
            return makeUpsertStatementJson(statement);
        case 'whileStatement':
            return makeWhileStatementJson(statement);
        case 'block':
            return makeBlockJson(statement);
    }
};

export const makeBlockJson = (target: BlockTypeClass): StatementJson[] => {
    return target.getFields().block.map((s) => makeStatementJson(s));
};
