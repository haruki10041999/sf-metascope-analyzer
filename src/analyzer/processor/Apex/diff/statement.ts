import {
    BaseExpressionJson,
    BlockStatementJson,
    BreakStatementJson,
    ContinueStatementJson,
    DeleteStatementJson,
    DoWhileStatementJson,
    ExpressionStatementJson,
    ForConditionJson,
    ForEachStatementJson,
    ForStatementJson,
    IfConditionBlockJson,
    IfStatementJson,
    InsertStatementJson,
    LocalVariableDeclarationBody,
    LocalVariableDeclarationJson,
    LocalVariableStatementJson,
    MergeStatementJson,
    ReturnStatementJson,
    RunAsStatementJson,
    StatementJson,
    SwitchStatementJson,
    SwitchWhenJson,
    ThrowStatementJson,
    TryClauseJson,
    TryStatementJson,
    TypeJson,
    UndeleteStatementJson,
    UpdateStatementJson,
    UpsertStatementJson,
    VariantJson,
    WhenConditionJson,
    WhenLiteralJson,
    WhileStatementJson,
} from '../../../types';

import {
    Match,
    NodeDiff,
    OptionalDiff,
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
import {
    TypedDiffContext,
    makeTypedArrayDiff,
    makeTypedDiffContext,
} from '../../commons/diff/typed';
import {
    TypedListDiff,
    TypedListItemDiff,
    TypedObjectDiff,
    makeTypedListDiff,
} from '../../commons/diff/list';

// Apex の文の差分 (docs/apex-implementation.md 6.5)。文の形は LWC にそろえた (docs/json-redesign-plan.md の段階 A4):
// 条件は式そのもの、本体はいつも文の配列 (BlockDiff)、for と forEach は別、catch の節は変数と型を直接持つ

export type Statement = StatementJson;
export type StatementValue = Statement;

type AccessLevelDiff = OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>>;

export type BlockStatementJsonDiff = NodeDiff<
    'blockStatement',
    BlockStatementJson,
    { block: BlockDiff }
>;
export type BreakStatementJsonDiff = NodeDiff<'break', BreakStatementJson, Record<string, never>>;
export type ContinueStatementJsonDiff = NodeDiff<
    'continue',
    ContinueStatementJson,
    Record<string, never>
>;
export type DeleteStatementJsonDiff = NodeDiff<
    'delete',
    DeleteStatementJson,
    { field: BaseExpressionJsonDiff; accessLevel: AccessLevelDiff }
>;
export type DoWhileStatementJsonDiff = NodeDiff<
    'doWhile',
    DoWhileStatementJson,
    { condition: BaseExpressionJsonDiff; block: BlockDiff }
>;
export type ExpressionStatementJsonDiff = NodeDiff<
    'expression',
    ExpressionStatementJson,
    { value: BaseExpressionJsonDiff }
>;
export type VariantJsonDiff = NodeDiff<
    'variant',
    VariantJson,
    {
        name: ValueDiff<string>;
        init: OptionalDiff<BaseExpressionJson, BaseExpressionJsonDiff>;
    }
>;
export type LocalVariableDeclarationFieldsDiff = {
    variants: TypedListDiff<VariantJson, VariantJsonDiff>;
    variantType: TypeJsonDiff;
    modifier: ModifiersJsonDiff;
};
export type LocalVariableDeclarationJsonDiff = TypedObjectDiff<
    LocalVariableDeclarationJson,
    LocalVariableDeclarationFieldsDiff
>;
export type ForConditionJsonDiff = TypedObjectDiff<
    ForConditionJson,
    {
        initializer: OptionalDiff<
            NonNullable<ForConditionJson['initializer']>,
            | LocalVariableDeclarationJsonDiff
            | ExpressionListDiff
            | ReplacementDiff<NonNullable<ForConditionJson['initializer']>>
        >;
        condition: OptionalDiff<BaseExpressionJson, BaseExpressionJsonDiff>;
        update: OptionalDiff<BaseExpressionJson[], ExpressionListDiff>;
    }
>;
export type ForStatementJsonDiff = NodeDiff<
    'for',
    ForStatementJson,
    { condition: ForConditionJsonDiff; block: BlockDiff }
>;
export type ForEachStatementJsonDiff = NodeDiff<
    'forEach',
    ForEachStatementJson,
    {
        variant: ValueDiff<string>;
        variantType: TypeJsonDiff;
        right: BaseExpressionJsonDiff;
        block: BlockDiff;
    }
>;
export type IfConditionBlockDiff = TypedObjectDiff<
    IfConditionBlockJson,
    {
        condition: ValueDiff<'else'> | BaseExpressionJsonDiff;
        block: BlockDiff;
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
    { field: BaseExpressionJsonDiff; accessLevel: AccessLevelDiff }
>;
export type LocalVariableStatementJsonDiff = NodeDiff<
    'localVariable',
    LocalVariableStatementJson,
    LocalVariableDeclarationFieldsDiff
>;
export type MergeStatementJsonDiff = NodeDiff<
    'merge',
    MergeStatementJson,
    { master: BaseExpressionJsonDiff; merged: BaseExpressionJsonDiff; accessLevel: AccessLevelDiff }
>;
export type ReturnStatementJsonDiff = NodeDiff<
    'return',
    ReturnStatementJson,
    { field: OptionalDiff<BaseExpressionJson, BaseExpressionJsonDiff> }
>;
export type RunAsStatementJsonDiff = NodeDiff<
    'runAs',
    RunAsStatementJson,
    { arg: ExpressionListDiff; block: BlockDiff }
>;
export type WhenTypeConditionJson = { variant: string; variantType: TypeJson };
/** when のリテラルの並び (`when 1, 2`) は順序が意味を持たないので B. 集合 (changed は作らない) */
export type WhenConditionValueDiff =
    | ValueDiff<'else'>
    | TypedListDiff<WhenLiteralJson, never>
    | TypedObjectDiff<
          WhenTypeConditionJson,
          { variant: ValueDiff<string>; variantType: TypeJsonDiff }
      >
    | ReplacementDiff<WhenConditionJson['condition']>;
export type WhenConditionJsonDiff = NodeDiff<
    'switchCondition',
    WhenConditionJson,
    { condition: WhenConditionValueDiff }
>;
export type SwitchWhenDiff = TypedObjectDiff<
    SwitchWhenJson,
    { condition: WhenConditionJsonDiff; block: BlockDiff }
>;
export type SwitchWhenListDiff = TypedListDiff<SwitchWhenJson, SwitchWhenDiff>;
export type SwitchStatementJsonDiff = NodeDiff<
    'switch',
    SwitchStatementJson,
    { value: BaseExpressionJsonDiff; when: SwitchWhenListDiff }
>;
export type ThrowStatementJsonDiff = NodeDiff<
    'throw',
    ThrowStatementJson,
    { value: BaseExpressionJsonDiff }
>;
export type TryClauseFieldsDiff =
    | { block: BlockDiff }
    | {
          block: BlockDiff;
          variant: ValueDiff<string>;
          variantType: TypeJsonDiff;
          modifier: ModifiersJsonDiff;
      };
export type TryClauseDiff = TypedObjectDiff<TryClauseJson, TryClauseFieldsDiff>;
export type TryClauseListDiff = TypedListDiff<
    TryClauseJson,
    TryClauseDiff | ReplacementDiff<TryClauseJson>
>;
export type TryStatementJsonDiff = NodeDiff<'try', TryStatementJson, { block: TryClauseListDiff }>;
export type UndeleteStatementJsonDiff = NodeDiff<
    'undelete',
    UndeleteStatementJson,
    { field: BaseExpressionJsonDiff; accessLevel: AccessLevelDiff }
>;
export type UpdateStatementJsonDiff = NodeDiff<
    'update',
    UpdateStatementJson,
    { field: BaseExpressionJsonDiff; accessLevel: AccessLevelDiff }
>;
export type UpsertStatementJsonDiff = NodeDiff<
    'upsert',
    UpsertStatementJson,
    {
        field: BaseExpressionJsonDiff;
        accessLevel: AccessLevelDiff;
        key: OptionalDiff<string[], TypedListDiff<string, ValueDiff<string>>>;
    }
>;
export type WhileStatementJsonDiff = NodeDiff<
    'while',
    WhileStatementJson,
    { condition: BaseExpressionJsonDiff; block: BlockDiff }
>;
/** 文の kind と、その差分の型の対応 */
type StatementDiffByKind = {
    blockStatement: BlockStatementJsonDiff;
    break: BreakStatementJsonDiff;
    continue: ContinueStatementJsonDiff;
    delete: DeleteStatementJsonDiff;
    doWhile: DoWhileStatementJsonDiff;
    expression: ExpressionStatementJsonDiff;
    for: ForStatementJsonDiff;
    forEach: ForEachStatementJsonDiff;
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

/** 入力の文の型に対応する差分の型 (docs/apex-implementation.md 6.5)。省略時は文 1 件の差分の union */
export type StatementJsonDiff<T extends Statement = Statement> = T extends {
    kind: infer K extends keyof StatementDiffByKind;
}
    ? StatementDiffByKind[K]
    : never;
export type StatementValueDiff = StatementJsonDiff | ReplacementDiff<StatementValue>;

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

/** else の節と条件のある節は組にしない */
const isSameElseness = <T extends { condition: unknown }>(before: T, after: T): boolean =>
    (before.condition === 'else') === (after.condition === 'else');

const makeValueListDiff = <T, D>(
    before: T[],
    after: T[],
    makeDiff: (before: T, after: T) => D,
): TypedListDiff<T, D> => makeStatementSequenceDiff(before, after, makeDiff);

const makeAccessLevelDiff = (
    before: 'SYSTEM' | 'USER' | undefined,
    after: 'SYSTEM' | 'USER' | undefined,
): AccessLevelDiff => makeOptionalDiff(before, after, makeValueDiff);

export const makeBlockStatementDiff = (
    before: BlockStatementJson,
    after: BlockStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): BlockStatementJsonDiff =>
    makeNodeDiff('blockStatement', before, after, 'slot', (b, a) => ({
        block: makeBlockDiffWithContext(b.block, a.block, sources, context),
    })) as unknown as BlockStatementJsonDiff;

export const makeBreakStatementDiff = (
    before: BreakStatementJson,
    after: BreakStatementJson,
): BreakStatementJsonDiff => makeNodeDiff('break', before, after, 'slot', () => ({}));

export const makeContinueStatementDiff = (
    before: ContinueStatementJson,
    after: ContinueStatementJson,
): ContinueStatementJsonDiff => makeNodeDiff('continue', before, after, 'slot', () => ({}));

export const makeDeleteStatementDiff = (
    before: DeleteStatementJson,
    after: DeleteStatementJson,
    sources?: Sources,
): DeleteStatementJsonDiff =>
    makeNodeDiff('delete', before, after, 'slot', (b, a) => ({
        field: makeExpressionValueDiff(b.field, a.field, sources),
        accessLevel: makeAccessLevelDiff(b.accessLevel, a.accessLevel),
    })) as unknown as DeleteStatementJsonDiff;

export const makeDoWhileStatementDiff = (
    before: DoWhileStatementJson,
    after: DoWhileStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): DoWhileStatementJsonDiff =>
    makeNodeDiff('doWhile', before, after, 'slot', (b, a) => ({
        condition: makeExpressionValueDiff(b.condition, a.condition, sources),
        block: makeBlockDiffWithContext(b.block, a.block, sources, context),
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
    makeNodeDiff('variant', before, after, 'slot', (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        init: makeOptionalDiff(b.init, a.init, (x, y) => makeExpressionValueDiff(x, y, sources)),
    })) as unknown as VariantJsonDiff;

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

const makeLocalVariableFieldsDiff = (
    before: LocalVariableDeclarationBody,
    after: LocalVariableDeclarationBody,
    sources?: Sources,
): LocalVariableDeclarationFieldsDiff => ({
    variants: makeVariantListDiff(before.variants, after.variants, sources),
    variantType: makeTypeDiff(before.variantType, after.variantType),
    modifier: makeModifierDiff(before.modifier, after.modifier),
});

export const makeLocalVariableDeclarationDiff = (
    before: LocalVariableDeclarationJson,
    after: LocalVariableDeclarationJson,
    sources?: Sources,
): LocalVariableDeclarationJsonDiff =>
    makeStatementObjectDiff(before, after, (b, a) =>
        makeLocalVariableFieldsDiff(b, a, sources),
    ) as unknown as LocalVariableDeclarationJsonDiff;

export const makeLocalVariableStatementDiff = (
    before: LocalVariableStatementJson,
    after: LocalVariableStatementJson,
    sources?: Sources,
): LocalVariableStatementJsonDiff =>
    makeNodeDiff('localVariable', before, after, 'slot', (b, a) =>
        makeLocalVariableFieldsDiff(b, a, sources),
    ) as unknown as LocalVariableStatementJsonDiff;

const makeForConditionDiff = (
    before: ForConditionJson,
    after: ForConditionJson,
    sources?: Sources,
): ForConditionJsonDiff =>
    makeStatementObjectDiff(before, after, (b, a) => ({
        initializer: makeOptionalDiff(b.initializer, a.initializer, (x, y) => {
            if (Array.isArray(x) && Array.isArray(y)) return makeExpressionListDiff(x, y, sources);
            if (!Array.isArray(x) && !Array.isArray(y)) {
                return makeLocalVariableDeclarationDiff(x, y, sources);
            }
            return makeReplacementDiff(x, y);
        }),
        condition: makeOptionalDiff(b.condition, a.condition, (x, y) =>
            makeExpressionValueDiff(x, y, sources),
        ),
        update: makeOptionalDiff(b.update, a.update, (x, y) =>
            makeExpressionListDiff(x, y, sources),
        ),
    })) as unknown as ForConditionJsonDiff;

export const makeForStatementDiff = (
    before: ForStatementJson,
    after: ForStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): ForStatementJsonDiff =>
    makeNodeDiff('for', before, after, 'slot', (b, a) => ({
        condition: makeForConditionDiff(b.condition, a.condition, sources),
        block: makeBlockDiffWithContext(b.block, a.block, sources, context),
    })) as unknown as ForStatementJsonDiff;

export const makeForEachStatementDiff = (
    before: ForEachStatementJson,
    after: ForEachStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): ForEachStatementJsonDiff =>
    makeNodeDiff('forEach', before, after, 'slot', (b, a) => ({
        variant: makeValueDiff(b.variant, a.variant),
        variantType: makeTypeDiff(b.variantType, a.variantType),
        right: makeExpressionValueDiff(b.right, a.right, sources),
        block: makeBlockDiffWithContext(b.block, a.block, sources, context),
    })) as unknown as ForEachStatementJsonDiff;

const makeIfConditionBlockDiff = (
    before: IfConditionBlockJson,
    after: IfConditionBlockJson,
    sources?: Sources,
    context?: TypedDiffContext,
): IfConditionBlockDiff | ReplacementDiff<IfConditionBlockJson> => {
    if (before.condition === 'else' || after.condition === 'else') {
        if (before.condition !== after.condition) return makeReplacementDiff(before, after);
        return makeStatementObjectDiff(before, after, (b, a) => ({
            condition: makeValueDiff('else' as const, 'else' as const),
            block: makeBlockDiffWithContext(b.block, a.block, sources, context),
        })) as IfConditionBlockDiff;
    }
    return makeStatementObjectDiff(before, after, (b, a) => ({
        condition: makeExpressionValueDiff(
            b.condition as BaseExpressionJson,
            a.condition as BaseExpressionJson,
            sources,
        ),
        block: makeBlockDiffWithContext(b.block, a.block, sources, context),
    })) as unknown as IfConditionBlockDiff;
};

export const makeIfStatementDiff = (
    before: IfStatementJson,
    after: IfStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): IfStatementJsonDiff =>
    makeNodeDiff('if', before, after, 'slot', (b, a) => ({
        // 条件は上から順に評価されるので C。else の節は条件のある節と組にしない
        conditionBlock: makeStatementSequenceDiff(
            b.conditionBlock,
            a.conditionBlock,
            (left, right) => makeIfConditionBlockDiff(left, right, sources, context),
            (left, right) => isSameElseness(left, right),
        ),
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
        master: makeExpressionValueDiff(b.master, a.master, sources),
        merged: makeExpressionValueDiff(b.merged, a.merged, sources),
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

export const makeRunAsStatementDiff = (
    before: RunAsStatementJson,
    after: RunAsStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): RunAsStatementJsonDiff =>
    makeNodeDiff('runAs', before, after, 'slot', (b, a) => ({
        arg: makeExpressionListDiff(b.arg, a.arg, sources),
        block: makeBlockDiffWithContext(b.block, a.block, sources, context),
    })) as unknown as RunAsStatementJsonDiff;

const makeWhenConditionValueDiff = (
    before: WhenConditionJson['condition'],
    after: WhenConditionJson['condition'],
): WhenConditionValueDiff => {
    if (before === 'else' && after === 'else') return makeValueDiff(before, after);
    if (before === 'else' || after === 'else') return makeReplacementDiff(before, after);
    if (Array.isArray(before) && Array.isArray(after)) {
        // `when 1, 2` の順は意味を持たないので B. 集合
        return makeStatementSetDiff(before, after);
    }
    if (!Array.isArray(before) && !Array.isArray(after)) {
        return makeStatementObjectDiff(before, after, (b, a) => ({
            variant: makeValueDiff(b.variant, a.variant),
            variantType: makeTypeDiff(b.variantType, a.variantType),
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

const makeSwitchWhenDiff = (
    before: SwitchWhenJson,
    after: SwitchWhenJson,
    sources?: Sources,
    context?: TypedDiffContext,
): SwitchWhenDiff =>
    makeStatementObjectDiff(before, after, (b, a) => ({
        condition: makeWhenConditionDiff(b.condition, a.condition),
        block: makeBlockDiffWithContext(b.block, a.block, sources, context),
    })) as SwitchWhenDiff;

export const makeSwitchStatementDiff = (
    before: SwitchStatementJson,
    after: SwitchStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): SwitchStatementJsonDiff =>
    makeNodeDiff('switch', before, after, 'slot', (b, a) => ({
        value: makeExpressionValueDiff(b.value, a.value, sources),
        // when else は最後に置く必要があるので C。when else は値のある when と組にしない
        when: makeStatementSequenceDiff(
            b.when,
            a.when,
            (x, y) => makeSwitchWhenDiff(x, y, sources, context),
            (x, y) => isSameElseness(x.condition, y.condition),
        ) as SwitchWhenListDiff,
    })) as unknown as SwitchStatementJsonDiff;

export const makeThrowStatementDiff = (
    before: ThrowStatementJson,
    after: ThrowStatementJson,
    sources?: Sources,
): ThrowStatementJsonDiff =>
    makeNodeDiff('throw', before, after, 'slot', (b, a) => ({
        value: makeExpressionValueDiff(b.value, a.value, sources),
    }));

const makeTryClauseDiff = (
    before: TryClauseJson,
    after: TryClauseJson,
    sources?: Sources,
    context?: TypedDiffContext,
): TryClauseDiff | ReplacementDiff<TryClauseJson> => {
    if (before.condition !== after.condition) return makeReplacementDiff(before, after);
    if (before.condition === 'catch' && after.condition === 'catch') {
        return makeStatementObjectDiff(before, after, (b, a) => {
            const bc = b as Extract<TryClauseJson, { condition: 'catch' }>;
            const ac = a as Extract<TryClauseJson, { condition: 'catch' }>;
            return {
                block: makeBlockDiffWithContext(bc.block, ac.block, sources, context),
                variant: makeValueDiff(bc.variant, ac.variant),
                variantType: makeTypeDiff(bc.variantType, ac.variantType),
                modifier: makeModifierItemsDiff(
                    bc.modifier.map((item) => ({ modifierType: 'catch', ...item })),
                    ac.modifier.map((item) => ({ modifierType: 'catch', ...item })),
                ),
            };
        }) as TryClauseDiff;
    }
    return makeStatementObjectDiff(before, after, (b, a) => ({
        block: makeBlockDiffWithContext(b.block, a.block, sources, context),
    })) as TryClauseDiff;
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
            (x, y) => makeTryClauseDiff(x, y, sources, context),
            (x, y) => x.condition === y.condition,
        ) as TryClauseListDiff,
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

export const makeWhileStatementDiff = (
    before: WhileStatementJson,
    after: WhileStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): WhileStatementJsonDiff =>
    makeNodeDiff('while', before, after, 'slot', (b, a) => ({
        condition: makeExpressionValueDiff(b.condition, a.condition, sources),
        block: makeBlockDiffWithContext(b.block, a.block, sources, context),
    })) as unknown as WhileStatementJsonDiff;

export const makeStatementValueDiff = (
    before: StatementValue,
    after: StatementValue,
    sources?: Sources,
    context?: TypedDiffContext,
): StatementValueDiff => {
    if (before.kind !== after.kind) return makeReplacementDiff(before, after);
    switch (before.kind) {
        case 'blockStatement':
            return makeBlockStatementDiff(before, after as BlockStatementJson, sources, context);
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
        case 'forEach':
            return makeForEachStatementDiff(
                before,
                after as ForEachStatementJson,
                sources,
                context,
            );
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
