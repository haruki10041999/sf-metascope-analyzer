import {
    BaseExpressionJson,
    BreakStatementJson,
    CatchConditionJson,
    ContinueStatementJson,
    DeleteStatementJson,
    DoWhileConditionJson,
    DoWhileStatementJson,
    ExpressionStatementJson,
    ForConditionJson,
    ForStatementJson,
    IfConditionJson,
    IfStatementJson,
    InsertStatementJson,
    LocalVariableDeclarationJson,
    LocalVariableStatementJson,
    MergeStatementJson,
    ReturnStatementJson,
    RunAsConditionJson,
    RunAsStatementJson,
    StatementJson,
    SwitchStatementJson,
    ThrowStatementJson,
    TryStatementJson,
    TypeJson,
    UndeleteStatementJson,
    UpdateStatementJson,
    UpsertStatementJson,
    VariantJson,
    WhenConditionJson,
    WhenVariantJson,
    WhileConditionJson,
    WhileStatementJson,
} from '../../../types';

import {
    Match,
    NodeDiff,
    OptionalDiff,
    Pairing,
    ReplacementDiff,
    Sources,
    ValueDiff,
    getObjectKey,
    getValueKey,
    makeNodeDiff,
    makeOptionalDiff,
    makeReplacementDiff,
    makeValueDiff,
    pairAsSequence,
    pairAsSet,
    pairByKey,
} from '../../commons/diff/commons';
import {
    DiffNodeValue,
    GumTreeDiff,
    makeGumTreeDiff,
    makeSourceDistance,
    matchTrees,
} from '../../commons/diff/gumtree';
import { makeBlockTree } from './gumtree/tree';
import {
    ExpressionListDiff,
    BaseExpressionJsonDiff,
    makeExpressionListDiff,
    makeExpressionValueDiff,
} from './expression';
import { ModifiersJsonDiff, makeModifierDiff, makeModifierItemsDiff } from './modifier';
import { TypeJsonDiff, makeTypeDiff } from './type';
import { TypedDiffContext, makeTypedArrayDiff, makeTypedDiffContext } from './typed';
import {
    TypedListDiff,
    TypedListItemDiff,
    TypedObjectDiff,
    makeTypedListDiff,
} from '../../commons/diff/list';

export type Statement = StatementJson;
export type StatementValue = Statement;
export type BreakStatementJsonDiff = NodeDiff<
    'break',
    BreakStatementJson,
    { value: ValueDiff<string> }
>;
export type ContinueStatementJsonDiff = NodeDiff<
    'continue',
    ContinueStatementJson,
    { value: ValueDiff<string> }
>;
export type DeleteStatementJsonDiff = NodeDiff<
    'delete',
    DeleteStatementJson,
    {
        field: BaseExpressionJsonDiff;
        accessLevel: OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>>;
    }
>;
export type DoWhileConditionJsonDiff = NodeDiff<
    'doWhileCondition',
    DoWhileConditionJson,
    { condition: BaseExpressionJsonDiff }
>;
export type DoWhileStatementJsonDiff = NodeDiff<
    'doWhile',
    DoWhileStatementJson,
    {
        condition: DoWhileConditionJsonDiff;
        body: BlockDiff;
    }
>;
export type ExpressionStatementJsonDiff = NodeDiff<
    'expression',
    ExpressionStatementJson,
    { value: BaseExpressionJsonDiff }
>;
export type LocalVariableDeclarationJsonDiff = TypedObjectDiff<
    LocalVariableDeclarationJson,
    LocalVariableDeclarationFieldsDiff
>;
export type LocalVariableDeclarationFieldsDiff = {
    variants: TypedListDiff<VariantJson, VariantJsonDiff>;
    variantsType: TypeJsonDiff;
    modifier: ModifiersJsonDiff;
};
export type VariantJsonDiff = TypedObjectDiff<
    VariantJson,
    {
        name: ValueDiff<string>;
        init: OptionalDiff<BaseExpressionJson, BaseExpressionJsonDiff>;
    }
>;
type ForEnhancedConditionJson = Extract<ForConditionJson, { initializeType: unknown }>;
type ForClassicConditionJson = Exclude<ForConditionJson, ForEnhancedConditionJson>;
export type ForConditionJsonDiff = NodeDiff<
    'forCondition',
    ForConditionJson,
    | {
          initializer: ValueDiff<string>;
          initializeType: TypeJsonDiff;
          baseObject: BaseExpressionJsonDiff;
      }
    | {
          initializer: OptionalDiff<
              NonNullable<ForClassicConditionJson['initializer']>,
              LocalVariableDeclarationJsonDiff | ExpressionListDiff
          >;
          condition: OptionalDiff<BaseExpressionJson, BaseExpressionJsonDiff>;
          update: OptionalDiff<BaseExpressionJson[], ExpressionListDiff>;
      }
>;
export type ForStatementJsonDiff = NodeDiff<
    'for',
    ForStatementJson,
    { condition: ForConditionJsonDiff; block: StatementValueDiff }
>;
export type IfConditionJsonDiff = NodeDiff<
    'ifCondition',
    IfConditionJson,
    { condition: BaseExpressionJsonDiff }
>;
export type IfConditionBlockJson = IfStatementJson['conditionBlock'][number];
export type IfConditionBlockDiff = TypedObjectDiff<
    IfConditionBlockJson,
    {
        condition:
            ValueDiff<'else'> | IfConditionJsonDiff | ReplacementDiff<IfConditionJson | 'else'>;
        block: StatementValueDiff;
    }
>;
export type IfStatementJsonDiff = NodeDiff<
    'if',
    IfStatementJson,
    {
        conditionBlock: TypedListDiff<
            IfConditionBlockJson,
            IfConditionBlockDiff | ReplacementDiff<IfConditionBlockJson>
        >;
    }
>;
export type InsertStatementJsonDiff = NodeDiff<
    'insert',
    InsertStatementJson,
    {
        field: BaseExpressionJsonDiff;
        accessLevel: OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>>;
    }
>;
export type LocalVariableStatementJsonDiff = NodeDiff<
    'localVariable',
    LocalVariableStatementJson,
    { variable: LocalVariableDeclarationJsonDiff }
>;
export type MergeStatementJsonDiff = NodeDiff<
    'merge',
    MergeStatementJson,
    {
        field: ExpressionListDiff;
        accessLevel: OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>>;
    }
>;
export type ReturnStatementJsonDiff = NodeDiff<
    'return',
    ReturnStatementJson,
    { field: OptionalDiff<BaseExpressionJson, BaseExpressionJsonDiff> }
>;
export type RunAsConditionJsonDiff = NodeDiff<
    'runAsCondition',
    RunAsConditionJson,
    { field: ExpressionListDiff }
>;
export type RunAsStatementJsonDiff = NodeDiff<
    'runAs',
    RunAsStatementJson,
    { condition: RunAsConditionJsonDiff; block: BlockDiff }
>;
export type WhenVariantJsonDiff = NodeDiff<
    'switchVariant',
    WhenVariantJson,
    { variant: BaseExpressionJsonDiff }
>;
export type WhenConditionEntryJson =
    | { value: string; valueType: 'string' | 'longText' | 'null' }
    | { value: string; valueType: 'integer' | 'long'; operator?: string }
    | { value: string[]; valueType: 'id' };
export type WhenConditionEntryDiff = TypedObjectDiff<
    WhenConditionEntryJson,
    {
        value: ValueDiff<string> | TypedListDiff<string, ValueDiff<string>>;
        valueType: ValueDiff<WhenConditionEntryJson['valueType']>;
        operator: OptionalDiff<string, ValueDiff<string>>;
    }
>;
export type WhenConditionTypedValueJson = { value: string; valueType: TypeJson };
/** when のリテラルの並び (`when 1, 2`) は順序が意味を持たないので B. 集合 (changed は作らない) */
export type WhenConditionValueDiff =
    | ValueDiff<'else'>
    | TypedListDiff<WhenConditionEntryJson, WhenConditionEntryDiff>
    | ReplacementDiff<WhenConditionEntryJson>
    | TypedObjectDiff<
          WhenConditionTypedValueJson,
          { value: ValueDiff<string>; valueType: TypeJsonDiff }
      >
    | ReplacementDiff<WhenConditionJson['condition']>;
export type WhenConditionJsonDiff = NodeDiff<
    'switchCondition',
    WhenConditionJson,
    { condition: WhenConditionValueDiff }
>;
export type SwitchBlockJson = SwitchStatementJson['block'][number];
export type SwitchBlockListDiff = TypedListDiff<SwitchBlockJson, SwitchBlockDiff>;
export type SwitchBlockDiff = TypedObjectDiff<
    SwitchBlockJson,
    {
        condition: WhenConditionJsonDiff;
        block: BlockDiff;
    }
>;
export type SwitchStatementJsonDiff = NodeDiff<
    'switch',
    SwitchStatementJson,
    {
        variant: WhenVariantJsonDiff;
        block: SwitchBlockListDiff;
    }
>;
export type ThrowStatementJsonDiff = NodeDiff<
    'throw',
    ThrowStatementJson,
    { value: BaseExpressionJsonDiff }
>;
export type CatchConditionJsonDiff = NodeDiff<
    'catchCondition',
    CatchConditionJson,
    {
        exception: ValueDiff<string>;
        // 修飾名は配列ごと値として比べる
        exceptionType: ValueDiff<string[]>;
        modifier: ModifiersJsonDiff;
    }
>;
export type TryBlockJson = TryStatementJson['block'][number];
export type TryBlockFieldsDiff =
    | { block: BlockDiff }
    | {
          block: BlockDiff;
          catchCondition: OptionalDiff<CatchConditionJson, CatchConditionJsonDiff>;
      };
export type TryBlockDiff = TypedObjectDiff<TryBlockJson, TryBlockFieldsDiff>;
export type TryBlockListDiff = TypedListDiff<
    TryBlockJson,
    TryBlockDiff | ReplacementDiff<TryBlockJson>
>;
export type TryStatementJsonDiff = NodeDiff<'try', TryStatementJson, { block: TryBlockListDiff }>;
export type UndeleteStatementJsonDiff = NodeDiff<
    'undelete',
    UndeleteStatementJson,
    {
        field: BaseExpressionJsonDiff;
        accessLevel: OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>>;
    }
>;
export type UpdateStatementJsonDiff = NodeDiff<
    'update',
    UpdateStatementJson,
    {
        field: BaseExpressionJsonDiff;
        accessLevel: OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>>;
    }
>;
export type UpsertStatementJsonDiff = NodeDiff<
    'upsert',
    UpsertStatementJson,
    {
        field: BaseExpressionJsonDiff;
        accessLevel: OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>>;
        key: OptionalDiff<string[], TypedListDiff<string, ValueDiff<string>>>;
    }
>;
export type WhileConditionJsonDiff = NodeDiff<
    'whileCondition',
    WhileConditionJson,
    { condition: BaseExpressionJsonDiff }
>;
export type WhileStatementJsonDiff = NodeDiff<
    'while',
    WhileStatementJson,
    {
        condition: WhileConditionJsonDiff;
        body: StatementValueDiff;
    }
>;
/** 文の kind と、その差分の型の対応 */
type StatementDiffByKind = {
    break: BreakStatementJsonDiff;
    continue: ContinueStatementJsonDiff;
    delete: DeleteStatementJsonDiff;
    doWhile: DoWhileStatementJsonDiff;
    expression: ExpressionStatementJsonDiff;
    for: ForStatementJsonDiff;
    if: IfStatementJsonDiff;
    insert: InsertStatementJsonDiff;
    localVariable: LocalVariableStatementJsonDiff;
    merge: MergeStatementJsonDiff;
    return: ReturnStatementJsonDiff;
    runAs: RunAsStatementJsonDiff;
    switch: SwitchStatementJsonDiff;
    throw: ThrowStatementJsonDiff;
    try: TryStatementJsonDiff;
    undelete: UndeleteStatementJsonDiff;
    update: UpdateStatementJsonDiff;
    upsert: UpsertStatementJsonDiff;
    while: WhileStatementJsonDiff;
};

/**
 * 入力の文の型に対応する差分の型 (docs/apex-implementation.md 6.5)。
 * 入れ子のブロック (文の配列) は BlockDiff。省略時は文 1 件 (配列以外) の差分の union
 */
export type StatementJsonDiff<T extends Statement = Exclude<Statement, unknown[]>> =
    T extends unknown[]
        ? BlockDiff
        : T extends { kind: infer K extends keyof StatementDiffByKind }
          ? StatementDiffByKind[K]
          : never;
export type StatementValueDiff = StatementJsonDiff | ReplacementDiff<StatementValue> | BlockDiff;

export interface BlockDiff extends Array<TypedListItemDiff<StatementValue, StatementValueDiff>> {}
export type BlockDiffer = (before: unknown[], after: unknown[], sources?: Sources) => BlockDiff;
export type GumTreeBlockDiff = GumTreeDiff<DiffNodeValue>[];

export type OpaqueStatementDiff =
    | {
          status: 'unchanged' | 'moved';
          match: Match;
          index: { before: number; after: number };
          value: Statement;
      }
    | {
          status: 'changed';
          match: Match;
          index: { before: number; after: number };
          before: Statement;
          after: Statement;
      }
    | { status: 'added' | 'removed'; index: number; value: Statement };

/** 文の比較用キー。入れ子のブロックは子のキーの並びから作る */
export const getStatementKey = (statement: Statement | Statement[]): string =>
    Array.isArray(statement)
        ? `{${statement.map(getStatementKey).join(',')}}`
        : getObjectKey(statement);

const getStatementKind = (statement: Statement | Statement[]): string =>
    Array.isArray(statement) ? 'block' : statement.kind;

/** GumTree を使わない簡易版。既存の出力比較用 */
export const makeOpaqueBlockDiff = (
    before: Statement[],
    after: Statement[],
): OpaqueStatementDiff[] => {
    const pairings = pairAsSequence(before.map(getStatementKey), after.map(getStatementKey), {
        canPair: (b, a) => getStatementKind(before[b]!) === getStatementKind(after[a]!),
    });

    return pairings.map((pairing) => {
        if (pairing.status === 'removed') {
            return { status: 'removed', index: pairing.before, value: before[pairing.before]! };
        }
        if (pairing.status === 'added') {
            return { status: 'added', index: pairing.after, value: after[pairing.after]! };
        }

        const index = { before: pairing.before, after: pairing.after };
        if (pairing.status === 'changed') {
            return {
                status: 'changed',
                match: pairing.match,
                index,
                before: before[pairing.before]!,
                after: after[pairing.after]!,
            };
        }
        return {
            status: pairing.status,
            match: pairing.match,
            index,
            value: before[pairing.before]!,
        };
    });
};

/** GumTree による文・式の並びの差分 */
export const makeGumTreeBlockDiff = (
    before: unknown[],
    after: unknown[],
    sources?: Sources,
): GumTreeBlockDiff => {
    const rootBefore = makeBlockTree(before);
    const rootAfter = makeBlockTree(after);
    const mappings = matchTrees(
        rootBefore,
        rootAfter,
        sources ? { distance: makeSourceDistance(sources) } : {},
    );
    return makeGumTreeDiff<DiffNodeValue>(rootBefore, rootAfter, mappings);
};

const makeStatementObjectDiff = <T extends object, Fields>(
    before: T,
    after: T,
    makeFields: (before: T, after: T) => Fields,
): TypedObjectDiff<T, Fields> =>
    getValueKey(before) === getValueKey(after)
        ? { status: 'unchanged', value: before }
        : { status: 'changed', fields: makeFields(before, after) };

/** C. 順序付き列。canPair の既定は「常に組にしてよい」 */
const makeStatementSequenceDiff = <T, D>(
    before: T[],
    after: T[],
    makeDiff: (before: T, after: T) => D,
    canPair: (before: T, after: T) => boolean = () => true,
): TypedListDiff<T, D> =>
    makeTypedListDiff(
        before,
        after,
        pairAsSequence(before.map(getValueKey), after.map(getValueKey), {
            canPair: (b, a) => canPair(before[b]!, after[a]!),
        }),
        makeDiff,
    );

/** B. 集合。順序を見ず、内容が同じものだけを組にする (changed は作らない) */
const makeStatementSetDiff = <T>(before: T[], after: T[]): TypedListDiff<T, never> =>
    makeTypedListDiff(
        before,
        after,
        pairAsSet(before.map(getValueKey), after.map(getValueKey)),
        () => undefined as never,
    );

/** D. キー対応。getId が undefined を返すものは集合として比べる */
const makeStatementKeyedDiff = <T, D>(
    before: T[],
    after: T[],
    getId: (item: T) => string | undefined,
    makeDiff: (before: T, after: T) => D,
): TypedListDiff<T, D> =>
    makeTypedListDiff(
        before,
        after,
        pairByKey(
            before.map(getId),
            after.map(getId),
            before.map(getValueKey),
            after.map(getValueKey),
        ),
        makeDiff,
    );

/** A. 位置のスロット。同じ index のもの同士を比べる (merge の [0] マスター / [1] 重複など) */
const makeSlotListDiff = <T, D>(
    before: T[],
    after: T[],
    makeDiff: (before: T, after: T) => D,
): TypedListDiff<T, D> =>
    makeTypedListDiff(
        before,
        after,
        Array.from({ length: Math.max(before.length, after.length) }, (_, i): Pairing => {
            if (i >= after.length) return { status: 'removed', before: i };
            if (i >= before.length) return { status: 'added', after: i };
            return getValueKey(before[i]) === getValueKey(after[i])
                ? { status: 'unchanged', match: 'identical', before: i, after: i }
                : { status: 'changed', match: 'slot', before: i, after: i };
        }),
        makeDiff,
    );

/** else の節と条件のある節は組にしない */
const isSameElseness = <T extends { condition: unknown }>(before: T, after: T): boolean =>
    (before.condition === 'else') === (after.condition === 'else');

const makeValueListDiff = <T, D>(
    before: T[],
    after: T[],
    makeDiff: (before: T, after: T) => D,
): TypedListDiff<T, D> => makeStatementSequenceDiff(before, after, makeDiff);

export const makeBreakStatementDiff = (
    before: BreakStatementJson,
    after: BreakStatementJson,
): BreakStatementJsonDiff =>
    makeNodeDiff('break', before, after, 'slot', (b, a) => ({
        value: makeValueDiff(b.value, a.value),
    }));

export const makeContinueStatementDiff = (
    before: ContinueStatementJson,
    after: ContinueStatementJson,
): ContinueStatementJsonDiff =>
    makeNodeDiff('continue', before, after, 'slot', (b, a) => ({
        value: makeValueDiff(b.value, a.value),
    }));

const makeAccessLevelDiff = (
    before: 'SYSTEM' | 'USER' | undefined,
    after: 'SYSTEM' | 'USER' | undefined,
): OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>> =>
    makeOptionalDiff(before, after, makeValueDiff);

export const makeDeleteStatementDiff = (
    before: DeleteStatementJson,
    after: DeleteStatementJson,
    sources?: Sources,
): DeleteStatementJsonDiff =>
    makeNodeDiff('delete', before, after, 'slot', (b, a) => ({
        field: makeExpressionValueDiff(b.field, a.field, sources),
        accessLevel: makeAccessLevelDiff(b.accessLevel, a.accessLevel),
    })) as unknown as DeleteStatementJsonDiff;

export const makeDoWhileConditionDiff = (
    before: DoWhileConditionJson,
    after: DoWhileConditionJson,
    sources?: Sources,
): DoWhileConditionJsonDiff =>
    makeNodeDiff('doWhileCondition', before, after, 'slot', (b, a) => ({
        condition: makeExpressionValueDiff(b.condition, a.condition, sources),
    }));

export const makeDoWhileStatementDiff = (
    before: DoWhileStatementJson,
    after: DoWhileStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): DoWhileStatementJsonDiff =>
    makeNodeDiff('doWhile', before, after, 'slot', (b, a) => ({
        condition: makeDoWhileConditionDiff(b.condition, a.condition, sources),
        body: makeBlockDiffWithContext(b.body, a.body, sources, context),
    })) as unknown as DoWhileStatementJsonDiff;

export const makeExpressionStatementDiff = (
    before: ExpressionStatementJson,
    after: ExpressionStatementJson,
    sources?: Sources,
): ExpressionStatementJsonDiff =>
    makeNodeDiff('expression', before, after, 'slot', (b, a) => ({
        value: makeExpressionValueDiff(b.value, a.value, sources),
    }));

export const makeVariantDiff = (
    before: VariantJson,
    after: VariantJson,
    sources?: Sources,
): VariantJsonDiff =>
    makeStatementObjectDiff(before, after, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        init: makeOptionalDiff(b.init, a.init, (x, y) => makeExpressionValueDiff(x, y, sources)),
    }));

const makeVariantListDiff = (
    before: VariantJson[],
    after: VariantJson[],
    sources?: Sources,
): LocalVariableDeclarationFieldsDiff['variants'] =>
    // 変数は D. キー対応 (キー: 変数名)
    makeStatementKeyedDiff(
        before,
        after,
        (variant) => variant.name,
        (b, a) => makeVariantDiff(b, a, sources),
    );

export const makeLocalVariableDeclarationDiff = (
    before: LocalVariableDeclarationJson,
    after: LocalVariableDeclarationJson,
    sources?: Sources,
): LocalVariableDeclarationJsonDiff =>
    makeStatementObjectDiff(before, after, (b, a) => ({
        variants: makeVariantListDiff(b.variants, a.variants, sources),
        variantsType: makeTypeDiff(b.variantsType, a.variantsType),
        modifier: makeModifierDiff(b.modifier, a.modifier),
    })) as unknown as LocalVariableDeclarationJsonDiff;

export const makeLocalVariableStatementDiff = (
    before: LocalVariableStatementJson,
    after: LocalVariableStatementJson,
    sources?: Sources,
): LocalVariableStatementJsonDiff =>
    makeNodeDiff('localVariable', before, after, 'slot', (b, a) => ({
        variable: makeLocalVariableDeclarationDiff(b.variable, a.variable, sources),
    }));

const makeForConditionDiff = (
    before: ForConditionJson,
    after: ForConditionJson,
    sources?: Sources,
): ForConditionJsonDiff => {
    return makeNodeDiff('forCondition', before, after, 'slot', (b, a) => {
        if ('initializeType' in b && 'initializeType' in a) {
            return {
                initializer: makeValueDiff(b.initializer, a.initializer),
                initializeType: makeTypeDiff(b.initializeType, a.initializeType),
                baseObject: makeExpressionValueDiff(b.baseObject, a.baseObject, sources),
            };
        }
        if ('initializeType' in b || 'initializeType' in a) return undefined;
        return {
            initializer: makeOptionalDiff(b.initializer, a.initializer, (x, y) => {
                if (Array.isArray(x) && Array.isArray(y)) {
                    return makeExpressionListDiff(x, y, sources);
                }
                if (!Array.isArray(x) && !Array.isArray(y)) {
                    return makeLocalVariableDeclarationDiff(x, y, sources);
                }
                return makeValueDiff(x, y);
            }),
            condition: makeOptionalDiff(b.condition, a.condition, (x, y) =>
                makeExpressionValueDiff(x, y, sources),
            ),
            update: makeOptionalDiff(b.update, a.update, (x, y) =>
                makeExpressionListDiff(x, y, sources),
            ),
        };
    }) as unknown as ForConditionJsonDiff;
};

export const makeForStatementDiff = (
    before: ForStatementJson,
    after: ForStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): ForStatementJsonDiff =>
    makeNodeDiff('for', before, after, 'slot', (b, a) => ({
        condition: makeForConditionDiff(b.condition, a.condition, sources),
        block: makeStatementValueDiff(b.block, a.block, sources, context),
    })) as unknown as ForStatementJsonDiff;

export const makeIfConditionDiff = (
    before: IfConditionJson,
    after: IfConditionJson,
    sources?: Sources,
): IfConditionJsonDiff =>
    makeNodeDiff('ifCondition', before, after, 'slot', (b, a) => ({
        condition: makeExpressionValueDiff(b.condition, a.condition, sources),
    }));

const makeIfConditionBlockDiff = (
    before: IfConditionBlockJson,
    after: IfConditionBlockJson,
    sources?: Sources,
    context?: TypedDiffContext,
): IfConditionBlockDiff | ReplacementDiff<IfConditionBlockJson> => {
    if (typeof before.condition === 'string' || typeof after.condition === 'string') {
        if (before.condition === after.condition) {
            return makeStatementObjectDiff(before, after, (b, a) => ({
                condition: makeValueDiff('else' as const, 'else' as const),
                block: makeStatementValueDiff(b.block, a.block, sources, context),
            })) as IfConditionBlockDiff;
        }
        return makeReplacementDiff(before, after);
    }
    return makeStatementObjectDiff(before, after, (b, a) => ({
        condition: makeIfConditionDiff(
            b.condition as IfConditionJson,
            a.condition as IfConditionJson,
            sources,
        ),
        block: makeStatementValueDiff(b.block, a.block, sources, context),
    })) as unknown as IfConditionBlockDiff;
};

export const makeIfStatementDiff = (
    before: IfStatementJson,
    after: IfStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): IfStatementJsonDiff =>
    makeNodeDiff('if', before, after, 'slot', (b, a) => ({
        conditionBlock: makeOptionalDiff(b.conditionBlock, a.conditionBlock, (x, y) => {
            // 条件は上から順に評価されるので C。else の節は条件のある節と組にしない
            return makeStatementSequenceDiff(
                x,
                y,
                (left, right) => makeIfConditionBlockDiff(left, right, sources, context),
                (left, right) => isSameElseness(left, right),
            );
        }),
    })) as unknown as IfStatementJsonDiff;

export const makeInsertStatementDiff = (
    before: InsertStatementJson,
    after: InsertStatementJson,
    sources?: Sources,
): InsertStatementJsonDiff =>
    makeNodeDiff('insert', before, after, 'slot', (b, a) => ({
        field: makeExpressionValueDiff(b.field, a.field, sources),
        accessLevel: makeAccessLevelDiff(b.accessLevel, a.accessLevel),
    })) as unknown as InsertStatementJsonDiff;

export const makeMergeStatementDiff = (
    before: MergeStatementJson,
    after: MergeStatementJson,
    sources?: Sources,
): MergeStatementJsonDiff =>
    makeNodeDiff('merge', before, after, 'slot', (b, a) => ({
        // [0] がマスター、[1] が重複のレコード。位置のスロット (A) として比べる
        field: makeSlotListDiff(b.field, a.field, (x, y) => makeExpressionValueDiff(x, y, sources)),
        accessLevel: makeAccessLevelDiff(b.accessLevel, a.accessLevel),
    })) as unknown as MergeStatementJsonDiff;

export const makeReturnStatementDiff = (
    before: ReturnStatementJson,
    after: ReturnStatementJson,
    sources?: Sources,
): ReturnStatementJsonDiff =>
    makeNodeDiff('return', before, after, 'slot', (b, a) => ({
        field: makeOptionalDiff(b.field, a.field, (x, y) => makeExpressionValueDiff(x, y, sources)),
    })) as unknown as ReturnStatementJsonDiff;

export const makeRunAsConditionDiff = (
    before: RunAsConditionJson,
    after: RunAsConditionJson,
    sources?: Sources,
): RunAsConditionJsonDiff =>
    makeNodeDiff('runAsCondition', before, after, 'slot', (b, a) => ({
        field: makeExpressionListDiff(b.field, a.field, sources),
    }));

export const makeRunAsStatementDiff = (
    before: RunAsStatementJson,
    after: RunAsStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): RunAsStatementJsonDiff =>
    makeNodeDiff('runAs', before, after, 'slot', (b, a) => ({
        condition: makeRunAsConditionDiff(b.condition, a.condition, sources),
        block: makeBlockDiffWithContext(b.block, a.block, sources, context),
    })) as unknown as RunAsStatementJsonDiff;

export const makeWhenVariantDiff = (
    before: WhenVariantJson,
    after: WhenVariantJson,
    sources?: Sources,
): WhenVariantJsonDiff =>
    makeNodeDiff('switchVariant', before, after, 'slot', (b, a) => ({
        variant: makeExpressionValueDiff(b.variant, a.variant, sources),
    }));

const makeWhenConditionValueDiff = (
    before: WhenConditionJson['condition'],
    after: WhenConditionJson['condition'],
): WhenConditionValueDiff => {
    if (before === 'else' && after === 'else') {
        return makeValueDiff(before, after);
    }
    if (before === 'else' || after === 'else') {
        return makeReplacementDiff(before, after);
    }
    if (Array.isArray(before) && Array.isArray(after)) {
        // `when 1, 2` の順は意味を持たないので B. 集合
        return makeStatementSetDiff(before, after);
    }
    if (
        typeof before === 'object' &&
        before !== null &&
        'valueType' in before &&
        typeof after === 'object' &&
        after !== null &&
        'valueType' in after
    ) {
        return makeStatementObjectDiff(before, after, (b, a) => ({
            value: makeValueDiff(b.value, a.value),
            valueType: makeTypeDiff(b.valueType, a.valueType),
        })) as WhenConditionValueDiff;
    }
    return makeReplacementDiff(before, after);
};

export const makeWhenConditionDiff = (
    before: WhenConditionJson,
    after: WhenConditionJson,
): WhenConditionJsonDiff =>
    makeNodeDiff('switchCondition', before, after, 'slot', (b, a) => ({
        condition: makeWhenConditionValueDiff(b.condition, a.condition),
    })) as unknown as WhenConditionJsonDiff;

const makeSwitchBlockDiff = (
    before: SwitchBlockJson,
    after: SwitchBlockJson,
    sources?: Sources,
    context?: TypedDiffContext,
): SwitchBlockDiff => {
    return makeStatementObjectDiff(before, after, (b, a) => ({
        condition: makeWhenConditionDiff(b.condition, a.condition),
        block: makeBlockDiffWithContext(b.block, a.block, sources, context),
    })) as SwitchBlockDiff;
};

export const makeSwitchStatementDiff = (
    before: SwitchStatementJson,
    after: SwitchStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): SwitchStatementJsonDiff =>
    makeNodeDiff('switch', before, after, 'slot', (b, a) => ({
        variant: makeWhenVariantDiff(b.variant, a.variant, sources),
        // when else は最後に置く必要があるので C。when else は値のある when と組にしない
        block: makeStatementSequenceDiff(
            b.block,
            a.block,
            (x, y) => makeSwitchBlockDiff(x, y, sources, context),
            (x, y) => isSameElseness(x.condition, y.condition),
        ) as SwitchBlockListDiff,
    })) as unknown as SwitchStatementJsonDiff;

export const makeThrowStatementDiff = (
    before: ThrowStatementJson,
    after: ThrowStatementJson,
    sources?: Sources,
): ThrowStatementJsonDiff =>
    makeNodeDiff('throw', before, after, 'slot', (b, a) => ({
        value: makeExpressionValueDiff(b.value, a.value, sources),
    }));

export const makeCatchConditionDiff = (
    before: CatchConditionJson,
    after: CatchConditionJson,
): CatchConditionJsonDiff =>
    makeNodeDiff('catchCondition', before, after, 'slot', (b, a) => ({
        exception: makeValueDiff(b.exception, a.exception),
        exceptionType: makeValueDiff(b.exceptionType, a.exceptionType),
        modifier: makeModifierItemsDiff(
            b.modifier.map((item) => ({ modifierType: 'catch', ...item })),
            a.modifier.map((item) => ({ modifierType: 'catch', ...item })),
        ),
    })) as unknown as CatchConditionJsonDiff;

const makeTryBlockDiff = (
    before: TryBlockJson,
    after: TryBlockJson,
    sources?: Sources,
    context?: TypedDiffContext,
): TryBlockDiff | ReplacementDiff<TryBlockJson> => {
    if (before.condition !== after.condition) return makeReplacementDiff(before, after);
    if (before.condition === 'catch' && after.condition === 'catch') {
        return makeStatementObjectDiff(before, after, (b, a) => ({
            block: makeBlockDiffWithContext(b.block, a.block, sources, context),
            catchCondition: makeOptionalDiff(
                b.catchCondition,
                a.catchCondition,
                makeCatchConditionDiff,
            ),
        })) as TryBlockDiff;
    }
    return makeStatementObjectDiff(before, after, (b, a) => ({
        block: makeBlockDiffWithContext(b.block, a.block, sources, context),
    })) as TryBlockDiff;
};

export const makeTryStatementDiff = (
    before: TryStatementJson,
    after: TryStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): TryStatementJsonDiff =>
    makeNodeDiff('try', before, after, 'slot', (b, a) => ({
        // catch は上から順に照合されるので C。try / catch / finally の種類が違う節は組にしない
        block: makeStatementSequenceDiff(
            b.block,
            a.block,
            (x, y) => makeTryBlockDiff(x, y, sources, context),
            (x, y) => x.condition === y.condition,
        ) as TryBlockListDiff,
    })) as unknown as TryStatementJsonDiff;

export const makeUndeleteStatementDiff = (
    before: UndeleteStatementJson,
    after: UndeleteStatementJson,
    sources?: Sources,
): UndeleteStatementJsonDiff =>
    makeNodeDiff('undelete', before, after, 'slot', (b, a) => ({
        field: makeExpressionValueDiff(b.field, a.field, sources),
        accessLevel: makeAccessLevelDiff(b.accessLevel, a.accessLevel),
    })) as unknown as UndeleteStatementJsonDiff;

export const makeUpdateStatementDiff = (
    before: UpdateStatementJson,
    after: UpdateStatementJson,
    sources?: Sources,
): UpdateStatementJsonDiff =>
    makeNodeDiff('update', before, after, 'slot', (b, a) => ({
        field: makeExpressionValueDiff(b.field, a.field, sources),
        accessLevel: makeAccessLevelDiff(b.accessLevel, a.accessLevel),
    })) as unknown as UpdateStatementJsonDiff;

export const makeUpsertStatementDiff = (
    before: UpsertStatementJson,
    after: UpsertStatementJson,
    sources?: Sources,
): UpsertStatementJsonDiff =>
    makeNodeDiff('upsert', before, after, 'slot', (b, a) => ({
        field: makeExpressionValueDiff(b.field, a.field, sources),
        accessLevel: makeAccessLevelDiff(b.accessLevel, a.accessLevel),
        key: makeOptionalDiff(b.key, a.key, (x, y) => makeValueListDiff(x, y, makeValueDiff)),
    })) as unknown as UpsertStatementJsonDiff;

export const makeWhileConditionDiff = (
    before: WhileConditionJson,
    after: WhileConditionJson,
    sources?: Sources,
): WhileConditionJsonDiff =>
    makeNodeDiff('whileCondition', before, after, 'slot', (b, a) => ({
        condition: makeExpressionValueDiff(b.condition, a.condition, sources),
    }));

export const makeWhileStatementDiff = (
    before: WhileStatementJson,
    after: WhileStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): WhileStatementJsonDiff =>
    makeNodeDiff('while', before, after, 'slot', (b, a) => ({
        condition: makeWhileConditionDiff(b.condition, a.condition, sources),
        body: makeStatementValueDiff(b.body, a.body, sources, context),
    })) as unknown as WhileStatementJsonDiff;

export const makeStatementValueDiff = (
    before: StatementValue,
    after: StatementValue,
    sources?: Sources,
    context?: TypedDiffContext,
): StatementValueDiff | ReplacementDiff<StatementValue> => {
    if (Array.isArray(before) && Array.isArray(after)) {
        return makeBlockDiffWithContext(before, after, sources, context);
    }
    if (Array.isArray(before) || Array.isArray(after)) return makeReplacementDiff(before, after);
    if (before.kind !== after.kind) return makeReplacementDiff(before, after);
    switch (before.kind) {
        case 'break':
            return makeBreakStatementDiff(before, after as BreakStatementJson);
        case 'continue':
            return makeContinueStatementDiff(before, after as ContinueStatementJson);
        case 'delete':
            return makeDeleteStatementDiff(before, after as DeleteStatementJson, sources);
        case 'doWhile':
            return makeDoWhileStatementDiff(
                before,
                after as DoWhileStatementJson,
                sources,
                context,
            );
        case 'expression':
            return makeExpressionStatementDiff(before, after as ExpressionStatementJson, sources);
        case 'for':
            return makeForStatementDiff(before, after as ForStatementJson, sources, context);
        case 'if':
            return makeIfStatementDiff(before, after as IfStatementJson, sources, context);
        case 'insert':
            return makeInsertStatementDiff(before, after as InsertStatementJson, sources);
        case 'localVariable':
            return makeLocalVariableStatementDiff(
                before,
                after as LocalVariableStatementJson,
                sources,
            );
        case 'merge':
            return makeMergeStatementDiff(before, after as MergeStatementJson, sources);
        case 'return':
            return makeReturnStatementDiff(before, after as ReturnStatementJson, sources);
        case 'runAs':
            return makeRunAsStatementDiff(before, after as RunAsStatementJson, sources, context);
        case 'switch':
            return makeSwitchStatementDiff(before, after as SwitchStatementJson, sources, context);
        case 'throw':
            return makeThrowStatementDiff(before, after as ThrowStatementJson, sources);
        case 'try':
            return makeTryStatementDiff(before, after as TryStatementJson, sources, context);
        case 'undelete':
            return makeUndeleteStatementDiff(before, after as UndeleteStatementJson, sources);
        case 'update':
            return makeUpdateStatementDiff(before, after as UpdateStatementJson, sources);
        case 'upsert':
            return makeUpsertStatementDiff(before, after as UpsertStatementJson, sources);
        case 'while':
            return makeWhileStatementDiff(before, after as WhileStatementJson, sources, context);
    }
};

const makeBlockDiffWithContext = (
    before: StatementValue[],
    after: StatementValue[],
    sources?: Sources,
    context?: TypedDiffContext,
): BlockDiff => {
    // 根のブロックでは、移動の情報 (context) を作るときの GumTree の結果をそのまま使う
    const { gumTreeDiffs, context: localContext } = context
        ? { gumTreeDiffs: makeGumTreeBlockDiff(before, after, sources), context }
        : makeTypedDiffContext(before, after, makeGumTreeBlockDiff, sources);
    return makeTypedArrayDiff<StatementValue, StatementValueDiff>(
        before,
        after,
        makeGumTreeBlockDiff,
        (beforeStatement, afterStatement, itemSources, itemContext) =>
            makeStatementValueDiff(beforeStatement, afterStatement, itemSources, itemContext),
        sources,
        localContext,
        gumTreeDiffs,
    ) as BlockDiff;
};

/**
 * 文 1 件の差分。文の内部の式・分岐・ブロックも再帰的に比較する。
 * kind が違う (形が合わない) ときは、値を丸ごと持つ ReplacementDiff<StatementValue> になる
 */
export const makeStatementDiff = <Before extends Statement, After extends Statement>(
    before: Before,
    after: After,
    sources?: Sources,
): StatementJsonDiff<Before | After> | ReplacementDiff<StatementValue> =>
    makeStatementValueDiff(
        before,
        after,
        sources,
        makeTypedDiffContext([before], [after], makeGumTreeBlockDiff, sources).context,
    ) as StatementJsonDiff<Before | After> | ReplacementDiff<StatementValue>;

/** 宣言やユニット本文が持つ文の並びの差分 */
export const makeBlockDiff: BlockDiffer = (before, after, sources) => {
    return makeBlockDiffWithContext(before as StatementValue[], after as StatementValue[], sources);
};
