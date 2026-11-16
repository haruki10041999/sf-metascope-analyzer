import typia from 'typia';

import { JsonType } from '../commons';
import type {
    AccessLevelTypeClass,
    BlockTypeClass,
    BreakStatementTypeClass,
    CatchClauseTypeClass,
    ContinueStatementTypeClass,
    DeleteStatementTypeClass,
    DoWhileStatementTypeClass,
    ExpressionStatementTypeClass,
    ForControlTypeClass,
    ForStatementTypeClass,
    IfStatementTypeClass,
    InsertStatementTypeClass,
    LocalVariableDeclarationStatementTypeClass,
    MergeStatementTypeClass,
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
} from '../apex_IR';

import { makeNodeJson } from './commons/node';
import {
    BaseExpressionJson,
    makeExpressionJsonConvert,
    makeExpressionListJson,
} from './expression';
import { TypeJson, makeTypeContentJsonOfNames, makeTypeJson } from './type';
import { LocalVariableDeclarationJson, makeLocalVariableDeclarationJson } from './declaration';
import { makeModifierJson, ModifierJson, AnnotationJson } from './modifier';
import {
    type IdentifierJson,
    type IntegerLiteralJson,
    type LongLiteralJson,
    type NullLiteralJson,
    type StringLiteralJson,
    unquoteApexString,
} from './primary';

// Apex の文の JSON (docs/apex-json-review.md 2.1・6.1 の E・F。docs/json-redesign-plan.md の段階 A4)。
// LWC の文 (js*) と同じ形にそろえた:
// - 条件は式そのもの (ifCondition / whileCondition / doWhileCondition / runAsCondition / switchVariant で包まない)
// - 本体 (block) はいつも文の配列。入れ子の { } は blockStatement
// - 通常の for と拡張 for (forEach) は別の kind
// - ローカル変数は入れ子にせず、変数は variant (kind を持つ)
// - catch の節は例外の変数 (variant) と型 (variantType。型の JSON) を直接持つ
// - break / continue は定数の文字列を持たない

const makeAccessLevelJson = (target: AccessLevelTypeClass): 'SYSTEM' | 'USER' => {
    return target.getFields().level;
};

// accessLevel はあるときだけ持つ
const accessLevelOf = (
    accessLevel: AccessLevelTypeClass | null,
): { accessLevel?: 'SYSTEM' | 'USER' } => {
    return accessLevel ? { accessLevel: makeAccessLevelJson(accessLevel) } : {};
};

export type BreakStatementJson = JsonType<'break'>;
export const isBreakStatementJson = typia.createIs<BreakStatementJson>();

export const makeBreakStatementJson = (target: BreakStatementTypeClass): BreakStatementJson =>
    makeNodeJson<BreakStatementJson>('break', target);

export type ContinueStatementJson = JsonType<'continue'>;
export const isContinueStatementJson = typia.createIs<ContinueStatementJson>();

export const makeContinueStatementJson = (
    target: ContinueStatementTypeClass,
): ContinueStatementJson => makeNodeJson<ContinueStatementJson>('continue', target);

export type DeleteStatementJson = JsonType<'delete'> & {
    field: BaseExpressionJson;
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

// 複合文は文全体の位置を持つ境界ノード
export type DoWhileStatementJson = JsonType<'doWhile'> & {
    condition: BaseExpressionJson;
    block: StatementJson[];
};
export const isDoWhileStatementJson = typia.createIs<DoWhileStatementJson>();

const makeDoWhileStatementJson = (target: DoWhileStatementTypeClass): DoWhileStatementJson => {
    const { value, block } = target.getFields();
    return makeNodeJson<DoWhileStatementJson>('doWhile', target, {
        condition: makeExpressionJsonConvert(value.getFields().value),
        block: makeBlockJson(block),
    });
};

export type ExpressionStatementJson = JsonType<'expression'> & {
    value: BaseExpressionJson;
};

export const isExpressionStatementJson = typia.createIs<ExpressionStatementJson>();

const makeExpressionStatementJson = (
    target: ExpressionStatementTypeClass,
): ExpressionStatementJson => {
    return makeNodeJson<ExpressionStatementJson>('expression', target, {
        value: makeExpressionJsonConvert(target.getFields().value),
    });
};

/** 通常の for の for (init; condition; update)。どれも省略されうる (kind を持たない入れ物) */
export type ForConditionJson = {
    initializer?: LocalVariableDeclarationJson | BaseExpressionJson[];
    condition?: BaseExpressionJson;
    update?: BaseExpressionJson[];
};

export type ForStatementJson = JsonType<'for'> & {
    condition: ForConditionJson;
    block: StatementJson[];
};
export const isForStatementJson = typia.createIs<ForStatementJson>();

/** 拡張 for (for (Type variant : right)) */
export type ForEachStatementJson = JsonType<'forEach'> & {
    variant: string;
    variantType: TypeJson;
    right: BaseExpressionJson;
    block: StatementJson[];
};
export const isForEachStatementJson = typia.createIs<ForEachStatementJson>();

const makeForConditionJson = (
    control: Extract<ReturnType<ForControlTypeClass['getFields']>, { kind: 'classic' }>,
): ForConditionJson => {
    const { init, condition, update } = control;
    const initValue = init?.getFields().value;
    const initializer = initValue
        ? initValue.kind === 'localVariableDeclaration'
            ? makeLocalVariableDeclarationJson(initValue)
            : initValue.getFields().value.map((v) => makeExpressionJsonConvert(v))
        : null;
    return {
        ...(initializer ? { initializer: initializer } : {}),
        ...(condition ? { condition: makeExpressionJsonConvert(condition) } : {}),
        ...(update ? { update: makeExpressionListJson(update.getFields().value) } : {}),
    };
};

const makeForStatementJson = (
    target: ForStatementTypeClass,
): ForStatementJson | ForEachStatementJson => {
    const { value, block } = target.getFields();
    const control = value.getFields();
    if (control.kind === 'enhanced') {
        const { value: variant, valueType, fromVariant } = control.control.getFields();
        return makeNodeJson<ForEachStatementJson>('forEach', target, {
            variant: variant.getFields().value,
            variantType: makeTypeJson(valueType),
            right: makeExpressionJsonConvert(fromVariant),
            block: makeBodyJson(block),
        });
    }
    return makeNodeJson<ForStatementJson>('for', target, {
        condition: makeForConditionJson(control),
        block: makeBodyJson(block),
    });
};

/** if の節 1 つ (kind を持たない入れ物)。else の節は最後 */
export type IfConditionBlockJson = {
    condition: 'else' | BaseExpressionJson;
    block: StatementJson[];
};

export type IfStatementJson = JsonType<'if'> & {
    conditionBlock: IfConditionBlockJson[];
};
export const isIfStatementJson = typia.createIs<IfStatementJson>();

const makeIfStatementJson = (target: IfStatementTypeClass): IfStatementJson => {
    const { branches, elseBlock } = target.getFields();
    // if・else if の分岐のあとに、else があれば condition: 'else' として最後に置く
    const conditionBlock: IfConditionBlockJson[] = branches.map((branch) => ({
        condition: makeExpressionJsonConvert(branch.condition.getFields().value),
        block: makeBodyJson(branch.block),
    }));
    if (elseBlock) {
        conditionBlock.push({ condition: 'else', block: makeBodyJson(elseBlock) });
    }
    return makeNodeJson<IfStatementJson>('if', target, { conditionBlock });
};

export type InsertStatementJson = JsonType<'insert'> & {
    field: BaseExpressionJson;
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

/** ローカル変数の宣言 (入れ子にしない。変数は variant) */
export type LocalVariableStatementJson = JsonType<'localVariable'> & LocalVariableDeclarationJson;
export const isLocalVariableStatementJson = typia.createIs<LocalVariableStatementJson>();

export const makeLocalVariableStatementJson = (
    target: LocalVariableDeclarationStatementTypeClass,
): LocalVariableStatementJson =>
    makeNodeJson<LocalVariableStatementJson>(
        'localVariable',
        target,
        makeLocalVariableDeclarationJson(target.getFields().value),
    );

/** merge master merged; (統合先のレコードと、統合して消すレコード) */
export type MergeStatementJson = JsonType<'merge'> & {
    master: BaseExpressionJson;
    merged: BaseExpressionJson;
    accessLevel?: 'SYSTEM' | 'USER';
};
export const isMergeStatementJson = typia.createIs<MergeStatementJson>();

export const makeMergeStatementJson = (target: MergeStatementTypeClass): MergeStatementJson => {
    const { master, merged, accessLevel } = target.getFields();
    return makeNodeJson<MergeStatementJson>('merge', target, {
        master: makeExpressionJsonConvert(master),
        merged: makeExpressionJsonConvert(merged),
        ...accessLevelOf(accessLevel),
    });
};

export type ReturnStatementJson = JsonType<'return'> & {
    field?: BaseExpressionJson;
};
export const isReturnStatementJson = typia.createIs<ReturnStatementJson>();

export const makeReturnStatementJson = (target: ReturnStatementTypeClass): ReturnStatementJson => {
    const { value } = target.getFields();
    return makeNodeJson<ReturnStatementJson>('return', target, {
        ...(value ? { field: makeExpressionJsonConvert(value) } : {}),
    });
};

/** System.runAs(user) { ... }。引数がなければ arg は空 */
export type RunAsStatementJson = JsonType<'runAs'> & {
    arg: BaseExpressionJson[];
    block: StatementJson[];
};
export const isRunAsStatementJson = typia.createIs<RunAsStatementJson>();

export const makeRunAsStatementJson = (target: RunAsStatementTypeClass): RunAsStatementJson => {
    const { value, block } = target.getFields();
    return makeNodeJson<RunAsStatementJson>('runAs', target, {
        arg: value ? makeExpressionListJson(value) : [],
        block: makeBlockJson(block),
    });
};

/** when のリテラル (式のノード。enum の値は識別子) */
export type WhenLiteralJson =
    StringLiteralJson | IntegerLiteralJson | LongLiteralJson | NullLiteralJson | IdentifierJson;

export type WhenConditionJson = JsonType<'switchCondition'> & {
    condition:
        | 'else'
        | WhenLiteralJson[]
        /** when Account a (型の when) */
        | { variant: string; variantType: TypeJson };
};

const makeWhenLiteralJson = (target: WhenLiteralTypeClass): WhenLiteralJson => {
    const literal = target.getFields();
    switch (literal.kind) {
        case 'id':
            return makeNodeJson<IdentifierJson>('identifier', target, {
                name: literal.value
                    .getFields()
                    .value.map((part) => part.getFields().value)
                    .join('.'),
            });
        case 'integer':
        case 'long':
            // 符号は値の前につなぐ (数は精度のため文字列のまま)
            return makeNodeJson<IntegerLiteralJson | LongLiteralJson>(literal.kind, target, {
                value: `${literal.signs.join('')}${literal.value}`,
            });
        case 'string':
        case 'longText':
            return makeNodeJson<StringLiteralJson>('string', target, {
                value: unquoteApexString(literal.value),
            });
        case 'null':
            return makeNodeJson<NullLiteralJson>('null', target);
    }
};

export const makeWhenConditionJson = (target: WhenValueTypeClass): WhenConditionJson => {
    const when = target.getFields();
    switch (when.kind) {
        case 'type':
            return makeNodeJson<WhenConditionJson>('switchCondition', target, {
                condition: {
                    variant: when.variable.getFields().value,
                    variantType: makeTypeJson(when.typeRef),
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

/** when の節 1 つ (kind を持たない入れ物) */
export type SwitchWhenJson = {
    condition: WhenConditionJson;
    block: StatementJson[];
};

export type SwitchStatementJson = JsonType<'switch'> & {
    /** switch on の式 */
    value: BaseExpressionJson;
    when: SwitchWhenJson[];
};
export const isSwitchStatementJson = typia.createIs<SwitchStatementJson>();

const makeSwitchStatementJson = (target: SwitchStatementTypeClass): SwitchStatementJson => {
    const { value, blocks } = target.getFields();
    return makeNodeJson<SwitchStatementJson>('switch', target, {
        value: makeExpressionJsonConvert(value),
        when: blocks.map((b) => {
            const when = b.getFields();
            return {
                condition: makeWhenConditionJson(when.value),
                block: makeBlockJson(when.block),
            };
        }),
    });
};

export type ThrowStatementJson = JsonType<'throw'> & {
    value: BaseExpressionJson;
};
export const isThrowStatementJson = typia.createIs<ThrowStatementJson>();

export const makeThrowStatementJson = (target: ThrowStatementTypeClass): ThrowStatementJson => {
    return makeNodeJson<ThrowStatementJson>('throw', target, {
        value: makeExpressionJsonConvert(target.getFields().value),
    });
};

/** try の節 (kind を持たない入れ物)。catch は例外の変数と型を直接持つ */
export type TryClauseJson =
    | { condition: 'try'; block: StatementJson[] }
    | {
          condition: 'catch';
          /** 例外の変数の名前 */
          variant: string;
          /** 例外の型 (型の JSON) */
          variantType: TypeJson;
          modifier: (ModifierJson | AnnotationJson)[];
          block: StatementJson[];
      }
    | { condition: 'finally'; block: StatementJson[] };

export type TryStatementJson = JsonType<'try'> & {
    block: TryClauseJson[];
};
export const isTryStatementJson = typia.createIs<TryStatementJson>();

const makeCatchClauseJson = (target: CatchClauseTypeClass): TryClauseJson => {
    const { value, valueType, modifier, block } = target.getFields();
    const names = valueType.getFields().value.map((v) => v.getFields().value);
    return {
        condition: 'catch',
        variant: value.getFields().value,
        variantType: makeNodeJson<TypeJson>(
            'type',
            valueType,
            makeTypeContentJsonOfNames(names, null),
        ),
        modifier: modifier.map((m) => makeModifierJson(m)),
        block: makeBlockJson(block),
    };
};

const makeTryStatementJson = (target: TryStatementTypeClass): TryStatementJson => {
    const { block, catchClauses, finallyBlock } = target.getFields();
    return makeNodeJson<TryStatementJson>('try', target, {
        block: [
            { condition: 'try', block: makeBlockJson(block) },
            ...catchClauses.map(makeCatchClauseJson),
            ...(finallyBlock
                ? [
                      {
                          condition: 'finally' as const,
                          block: makeBlockJson(finallyBlock.getFields().block),
                      },
                  ]
                : []),
        ],
    });
};

export type UndeleteStatementJson = JsonType<'undelete'> & {
    field: BaseExpressionJson;
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
    field: BaseExpressionJson;
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
    field: BaseExpressionJson;
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

export type WhileStatementJson = JsonType<'while'> & {
    condition: BaseExpressionJson;
    block: StatementJson[];
};
export const isWhileStatementJson = typia.createIs<WhileStatementJson>();

const makeWhileStatementJson = (target: WhileStatementTypeClass): WhileStatementJson => {
    const { value, block } = target.getFields();
    return makeNodeJson<WhileStatementJson>('while', target, {
        condition: makeExpressionJsonConvert(value.getFields().value),
        block: makeBodyJson(block),
    });
};

/** 入れ子の { } (ブロックの文) */
export type BlockStatementJson = JsonType<'blockStatement'> & {
    block: StatementJson[];
};
export const isBlockStatementJson = typia.createIs<BlockStatementJson>();

export type StatementJson =
    | BlockStatementJson
    | BreakStatementJson
    | ContinueStatementJson
    | DeleteStatementJson
    | DoWhileStatementJson
    | ExpressionStatementJson
    | ForStatementJson
    | ForEachStatementJson
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

// statement は中の文だけを JSON にする (statement 自身のキーは使わない)
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
            return makeNodeJson<BlockStatementJson>('blockStatement', statement, {
                block: makeBlockJson(statement),
            });
    }
};

/**
 * if・for・while の本体。{ } ならその中の文の並び、1 文ならその文だけの並び
 * (どちらも文の配列にする。LWC と同じ)
 */
const makeBodyJson = (target: StatementTypeClass): StatementJson[] => {
    const statement = target.getFields().statement;
    return statement.kind === 'block' ? makeBlockJson(statement) : [makeStatementJson(target)];
};

export const makeBlockJson = (target: BlockTypeClass): StatementJson[] => {
    return target.getFields().block.map((s) => makeStatementJson(s));
};
