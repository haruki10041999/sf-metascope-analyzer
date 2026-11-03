import {
    BaseExpressionJson,
    BreakStatementJson,
    CatchConditionJson,
    ContinueStatementJson,
    DeleteStatementJson,
    DoWhileConditionJson,
    DoWhileStatementJson,
    ErrorJson,
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
    Sources,
    ValueDiff,
    getObjectKey,
    getValueKey,
    makeNodeDiff,
    makeOptionalDiff,
    makeValueDiff,
    pairAsSequence,
} from './commons';
import { SourceDistance, findSourceInfo, getSourceDistance } from '../commons';
import { GumTreeDiff, makeGumTreeDiff } from './gumtree/diff';
import { matchTrees } from './gumtree/matcher';
import { DiffNodeValue, GumTreeNode, makeBlockTree } from './gumtree/tree';
import {
    ExpressionListDiff,
    ExpressionValueDiff,
    makeExpressionListDiff,
    makeExpressionValueDiff,
} from './expression';
import { ModifierDiff } from './modifier';
import { makeModifierDiff, makeModifierItemsDiff } from './modifier';
import { TypeDiff, makeTypeDiff } from './type';
import {
    TypedDiffContext,
    TypedListDiff,
    TypedListItemDiff,
    TypedObjectDiff,
    makeTypedArrayDiff,
    makeTypedDiffContext,
} from './typed';

export type Statement = StatementJson | ErrorJson;
export type StatementValue = Statement | ErrorJson;
export type ErrorStatementDiff = NodeDiff<'error', ErrorJson, { kindType: ValueDiff<string> }>;
export type JsonShapeReplacementDiff<T> = { status: 'changed'; before: T; after: T };
export type BreakStatementDiff = NodeDiff<'break', BreakStatementJson, {}>;
export type ContinueStatementDiff = NodeDiff<'continue', ContinueStatementJson, {}>;
export type DeleteStatementDiff = NodeDiff<
    'delete',
    DeleteStatementJson,
    {
        field: ExpressionValueDiff;
        accessLevel: OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>>;
    }
>;
export type DoWhileConditionDiff = NodeDiff<
    'doWhileCondition',
    DoWhileConditionJson,
    { condition: ExpressionValueDiff }
>;
export type DoWhileStatementDiff = NodeDiff<
    'doWhile',
    DoWhileStatementJson,
    {
        condition:
            | DoWhileConditionDiff
            | ErrorStatementDiff
            | JsonShapeReplacementDiff<DoWhileConditionJson | ErrorJson>;
        body: BlockDiff;
    }
>;
export type ExpressionStatementDiff = NodeDiff<
    'expression',
    ExpressionStatementJson,
    { value: ExpressionValueDiff }
>;
export type LocalVariableDeclarationDiff = TypedObjectDiff<
    LocalVariableDeclarationJson,
    LocalVariableDeclarationFieldsDiff
>;
export type LocalVariableDeclarationFieldsDiff = {
    variants:
        | TypedListDiff<
              VariantJson | ErrorJson,
              VariantDiff | ErrorStatementDiff | JsonShapeReplacementDiff<VariantJson | ErrorJson>
          >
        | ErrorStatementDiff
        | JsonShapeReplacementDiff<(VariantJson | ErrorJson)[] | ErrorJson>;
    variantsType: TypeDiff;
    modifier: ModifierDiff[];
};
export type VariantDiff = TypedObjectDiff<
    VariantJson,
    {
        name: ValueDiff<string | ErrorJson>;
        init: OptionalDiff<BaseExpressionJson | ErrorJson, ExpressionValueDiff>;
    }
>;
type ForEnhancedConditionJson = Extract<ForConditionJson, { initializeType: unknown }>;
type ForClassicConditionJson = Exclude<ForConditionJson, ForEnhancedConditionJson>;
export type ForConditionDiff = NodeDiff<
    'forCondition',
    ForConditionJson,
    | {
          initializer: ValueDiff<string>;
          initializeType: TypeDiff;
          baseObject: ExpressionValueDiff;
      }
    | {
          initializer: OptionalDiff<
              NonNullable<ForClassicConditionJson['initializer']>,
              LocalVariableDeclarationDiff | ExpressionListDiff
          >;
          condition: OptionalDiff<BaseExpressionJson | ErrorJson, ExpressionValueDiff>;
          update: OptionalDiff<(BaseExpressionJson | ErrorJson)[], ExpressionListDiff>;
      }
>;
export type ForConditionValueDiff =
    ForConditionDiff | ErrorStatementDiff | JsonShapeReplacementDiff<ForConditionJson | ErrorJson>;
export type ForStatementDiff = NodeDiff<
    'for',
    ForStatementJson,
    { condition: ForConditionValueDiff; block: StatementValueDiff }
>;
export type IfConditionDiff = NodeDiff<
    'ifCondition',
    IfConditionJson,
    { condition: ExpressionValueDiff }
>;
export type IfConditionBlockJson = Exclude<
    NonNullable<IfStatementJson['conditionBlock']>,
    ErrorJson
>[number];
export type IfConditionBlockDiff = TypedObjectDiff<
    IfConditionBlockJson,
    {
        condition:
            | 'else'
            | IfConditionDiff
            | ErrorStatementDiff
            | JsonShapeReplacementDiff<IfConditionJson | ErrorJson | 'else'>;
        block: StatementValueDiff;
    }
>;
export type IfStatementDiff = NodeDiff<
    'if',
    IfStatementJson,
    {
        conditionBlock:
            | TypedListDiff<
                  IfConditionBlockJson | ErrorJson,
                  | IfConditionBlockDiff
                  | ErrorStatementDiff
                  | JsonShapeReplacementDiff<IfConditionBlockJson | ErrorJson>
              >
            | ErrorStatementDiff
            | JsonShapeReplacementDiff<(IfConditionBlockJson | ErrorJson)[] | ErrorJson>;
    }
>;
export type InsertStatementDiff = NodeDiff<
    'insert',
    InsertStatementJson,
    {
        field: ExpressionValueDiff;
        accessLevel: OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>>;
    }
>;
export type LocalVariableStatementDiff = NodeDiff<
    'localVariable',
    LocalVariableStatementJson,
    { variable: LocalVariableDeclarationDiff }
>;
export type MergeStatementDiff = NodeDiff<
    'merge',
    MergeStatementJson,
    {
        field: ExpressionListDiff;
        accessLevel: OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>>;
    }
>;
export type ReturnStatementDiff = NodeDiff<
    'return',
    ReturnStatementJson,
    { field: OptionalDiff<BaseExpressionJson | ErrorJson, ExpressionValueDiff> }
>;
export type RunAsConditionDiff = NodeDiff<
    'runAsCondition',
    RunAsConditionJson,
    { field: ExpressionListDiff }
>;
export type RunAsConditionValueDiff =
    | RunAsConditionDiff
    | ErrorStatementDiff
    | JsonShapeReplacementDiff<RunAsConditionJson | ErrorJson>;
export type RunAsStatementDiff = NodeDiff<
    'runAs',
    RunAsStatementJson,
    { condition: RunAsConditionValueDiff; block: BlockDiff }
>;
export type WhenVariantDiff = NodeDiff<
    'switchVariant',
    WhenVariantJson,
    { variant: ExpressionValueDiff }
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
export type WhenConditionTypedValueJson = { value: string; valueType: TypeJson | ErrorJson };
export type WhenConditionValueDiff =
    | 'else'
    | TypedListDiff<WhenConditionEntryJson, WhenConditionEntryDiff>
    | JsonShapeReplacementDiff<WhenConditionEntryJson>
    | TypedObjectDiff<
          WhenConditionTypedValueJson,
          { value: ValueDiff<string>; valueType: TypeDiff }
      >
    | JsonShapeReplacementDiff<WhenConditionJson['condition']>;
export type WhenConditionDiff = NodeDiff<
    'switchCondition',
    WhenConditionJson,
    { condition: WhenConditionValueDiff }
>;
export type SwitchBlockJson = Exclude<SwitchStatementJson['block'][number], ErrorJson>;
export type SwitchBlockListDiff = TypedListDiff<
    SwitchBlockJson | ErrorJson,
    SwitchBlockDiff | ErrorStatementDiff | JsonShapeReplacementDiff<SwitchBlockJson | ErrorJson>
>;
export type SwitchBlockDiff = TypedObjectDiff<
    SwitchBlockJson,
    {
        condition:
            | WhenConditionDiff
            | ErrorStatementDiff
            | JsonShapeReplacementDiff<WhenConditionJson | ErrorJson>;
        block: BlockDiff;
    }
>;
export type SwitchStatementDiff = NodeDiff<
    'switch',
    SwitchStatementJson,
    {
        variant:
            | WhenVariantDiff
            | ErrorStatementDiff
            | JsonShapeReplacementDiff<WhenVariantJson | ErrorJson>;
        block: SwitchBlockListDiff;
    }
>;
export type ThrowStatementDiff = NodeDiff<
    'throw',
    ThrowStatementJson,
    { value: ExpressionValueDiff }
>;
export type CatchConditionDiff = NodeDiff<
    'catchCondition',
    CatchConditionJson,
    {
        exception: ValueDiff<string>;
        exceptionType: TypedListDiff<string, ValueDiff<string>>;
        modifier: ModifierDiff[];
    }
>;
export type TryBlockJson = Exclude<TryStatementJson['block'][number], ErrorJson>;
export type TryBlockFieldsDiff =
    | { block: BlockDiff }
    | {
          block: BlockDiff;
          catchCondition: OptionalDiff<
              CatchConditionJson | ErrorJson,
              | CatchConditionDiff
              | ErrorStatementDiff
              | JsonShapeReplacementDiff<CatchConditionJson | ErrorJson>
          >;
      };
export type TryBlockDiff = TypedObjectDiff<TryBlockJson, TryBlockFieldsDiff>;
export type TryBlockListDiff = TypedListDiff<
    TryBlockJson | ErrorJson,
    TryBlockDiff | ErrorStatementDiff | JsonShapeReplacementDiff<TryBlockJson | ErrorJson>
>;
export type TryStatementDiff = NodeDiff<'try', TryStatementJson, { block: TryBlockListDiff }>;
export type UndeleteStatementDiff = NodeDiff<
    'undelete',
    UndeleteStatementJson,
    {
        field: ExpressionValueDiff;
        accessLevel: OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>>;
    }
>;
export type UpdateStatementDiff = NodeDiff<
    'update',
    UpdateStatementJson,
    {
        field: ExpressionValueDiff;
        accessLevel: OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>>;
    }
>;
export type UpsertStatementDiff = NodeDiff<
    'upsert',
    UpsertStatementJson,
    {
        field: ExpressionValueDiff;
        accessLevel: OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>>;
        key: OptionalDiff<string[], TypedListDiff<string, ValueDiff<string>>>;
    }
>;
export type WhileConditionDiff = NodeDiff<
    'whileCondition',
    WhileConditionJson,
    { condition: ExpressionValueDiff }
>;
export type WhileConditionValueDiff =
    | WhileConditionDiff
    | ErrorStatementDiff
    | JsonShapeReplacementDiff<WhileConditionJson | ErrorJson>;
export type WhileStatementDiff = NodeDiff<
    'while',
    WhileStatementJson,
    {
        condition: WhileConditionValueDiff;
        body: StatementValueDiff;
    }
>;
export type StatementDiff =
    | ErrorStatementDiff
    | BreakStatementDiff
    | ContinueStatementDiff
    | DeleteStatementDiff
    | DoWhileStatementDiff
    | ExpressionStatementDiff
    | ForStatementDiff
    | IfStatementDiff
    | InsertStatementDiff
    | LocalVariableStatementDiff
    | MergeStatementDiff
    | ReturnStatementDiff
    | RunAsStatementDiff
    | SwitchStatementDiff
    | ThrowStatementDiff
    | TryStatementDiff
    | UndeleteStatementDiff
    | UpdateStatementDiff
    | UpsertStatementDiff
    | WhileStatementDiff;
export type StatementValueDiff = StatementDiff | StatementReplacementDiff | BlockDiff;
export interface BlockDiff extends Array<TypedListItemDiff<StatementValue, StatementValueDiff>> {}
export type BlockDiffer = (before: unknown[], after: unknown[], sources?: Sources) => BlockDiff;
export type GumTreeBlockDiff = GumTreeDiff<DiffNodeValue>[];
export type StatementReplacementDiff = {
    status: 'changed';
    before: StatementValue;
    after: StatementValue;
};

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

const makeNodeDistance = (sources: Sources) => {
    return (before: GumTreeNode, after: GumTreeNode): SourceDistance | undefined => {
        if (!before.source || !after.source) {
            return undefined;
        }
        try {
            return getSourceDistance(
                findSourceInfo(sources.before, before.source),
                findSourceInfo(sources.after, after.source),
            );
        } catch {
            return undefined;
        }
    };
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
        sources ? { distance: makeNodeDistance(sources) } : {},
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

const makeStatementSequenceDiff = <T, D>(
    before: T[],
    after: T[],
    makeDiff: (before: T, after: T) => D,
): TypedListDiff<T, D> => {
    const pairings = pairAsSequence(before.map(getValueKey), after.map(getValueKey), {
        canPair: () => true,
    });
    return pairings.map((pairing) => {
        if (pairing.status === 'removed') {
            return { status: 'removed', index: pairing.before, value: before[pairing.before]! };
        }
        if (pairing.status === 'added') {
            return { status: 'added', index: pairing.after, value: after[pairing.after]! };
        }
        const index = { before: pairing.before, after: pairing.after };
        if (pairing.status === 'unchanged') {
            return {
                status: 'unchanged',
                match: pairing.match,
                index,
                value: after[pairing.after]!,
            };
        }
        return {
            status: pairing.status,
            match: pairing.match,
            index,
            value: makeDiff(before[pairing.before]!, after[pairing.after]!),
        };
    }) as TypedListDiff<T, D>;
};

const makeValueListDiff = <T, D>(
    before: T[],
    after: T[],
    makeDiff: (before: T, after: T) => D,
): TypedListDiff<T, D> => makeStatementSequenceDiff(before, after, makeDiff);

const makeErrorStatementDiff = (before: ErrorJson, after: ErrorJson): ErrorStatementDiff =>
    makeNodeDiff('error', before, after, 'slot', (b, a) => ({
        kindType: makeValueDiff(b.kindType, a.kindType),
    }));

export const makeBreakStatementDiff = (
    before: BreakStatementJson,
    after: BreakStatementJson,
): BreakStatementDiff => makeNodeDiff('break', before, after, 'slot', () => ({}));

export const makeContinueStatementDiff = (
    before: ContinueStatementJson,
    after: ContinueStatementJson,
): ContinueStatementDiff => makeNodeDiff('continue', before, after, 'slot', () => ({}));

const makeAccessLevelDiff = (
    before: 'SYSTEM' | 'USER' | undefined,
    after: 'SYSTEM' | 'USER' | undefined,
): OptionalDiff<'SYSTEM' | 'USER', ValueDiff<'SYSTEM' | 'USER'>> =>
    makeOptionalDiff(before, after, makeValueDiff);

export const makeDeleteStatementDiff = (
    before: DeleteStatementJson,
    after: DeleteStatementJson,
    sources?: Sources,
): DeleteStatementDiff =>
    makeNodeDiff('delete', before, after, 'slot', (b, a) => ({
        field: makeExpressionValueDiff(b.field, a.field, sources),
        accessLevel: makeAccessLevelDiff(b.accessLevel, a.accessLevel),
    })) as unknown as DeleteStatementDiff;

export const makeDoWhileConditionDiff = (
    before: DoWhileConditionJson,
    after: DoWhileConditionJson,
    sources?: Sources,
): DoWhileConditionDiff =>
    makeNodeDiff('doWhileCondition', before, after, 'slot', (b, a) => ({
        condition: makeExpressionValueDiff(b.condition, a.condition, sources),
    }));

const makeDoWhileConditionValueDiff = (
    before: DoWhileConditionJson | ErrorJson,
    after: DoWhileConditionJson | ErrorJson,
    sources?: Sources,
):
    | DoWhileConditionDiff
    | ErrorStatementDiff
    | JsonShapeReplacementDiff<DoWhileConditionJson | ErrorJson> => {
    if (before.kind === 'error' || after.kind === 'error') {
        return before.kind === 'error' && after.kind === 'error'
            ? makeErrorStatementDiff(before, after)
            : { status: 'changed', before, after };
    }
    return makeDoWhileConditionDiff(before, after, sources);
};

export const makeDoWhileStatementDiff = (
    before: DoWhileStatementJson,
    after: DoWhileStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): DoWhileStatementDiff =>
    makeNodeDiff('doWhile', before, after, 'slot', (b, a) => ({
        condition: makeDoWhileConditionValueDiff(b.condition, a.condition, sources),
        body: makeBlockDiffWithContext(b.body, a.body, sources, context),
    })) as unknown as DoWhileStatementDiff;

export const makeExpressionStatementDiff = (
    before: ExpressionStatementJson,
    after: ExpressionStatementJson,
    sources?: Sources,
): ExpressionStatementDiff =>
    makeNodeDiff('expression', before, after, 'slot', (b, a) => ({
        value: makeExpressionValueDiff(b.value, a.value, sources),
    }));

export const makeVariantDiff = (
    before: VariantJson,
    after: VariantJson,
    sources?: Sources,
): VariantDiff =>
    makeStatementObjectDiff(before, after, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        init: makeOptionalDiff(b.init, a.init, (x, y) => makeExpressionValueDiff(x, y, sources)),
    }));

const makeVariantListDiff = (
    before: (VariantJson | ErrorJson)[] | ErrorJson,
    after: (VariantJson | ErrorJson)[] | ErrorJson,
    sources?: Sources,
): LocalVariableDeclarationFieldsDiff['variants'] => {
    if (!Array.isArray(before) || !Array.isArray(after)) {
        return { status: 'changed', before, after };
    }
    return makeStatementSequenceDiff(before, after, (b, a) =>
        'kind' in b
            ? 'kind' in a
                ? makeErrorStatementDiff(b, a)
                : { status: 'changed', before: b, after: a }
            : 'kind' in a
              ? { status: 'changed', before: b, after: a }
              : makeVariantDiff(b, a, sources),
    ) as LocalVariableDeclarationFieldsDiff['variants'];
};

export const makeLocalVariableDeclarationDiff = (
    before: LocalVariableDeclarationJson,
    after: LocalVariableDeclarationJson,
    sources?: Sources,
): LocalVariableDeclarationDiff =>
    makeStatementObjectDiff(before, after, (b, a) => ({
        variants: makeVariantListDiff(b.variants, a.variants, sources),
        variantsType: makeTypeDiff(b.variantsType, a.variantsType),
        modifier: makeModifierDiff(b.modifier, a.modifier),
    })) as unknown as LocalVariableDeclarationDiff;

export const makeLocalVariableStatementDiff = (
    before: LocalVariableStatementJson,
    after: LocalVariableStatementJson,
    sources?: Sources,
): LocalVariableStatementDiff =>
    makeNodeDiff('localVariable', before, after, 'slot', (b, a) => ({
        variable: makeLocalVariableDeclarationDiff(b.variable, a.variable, sources),
    }));

const makeForConditionDiff = (
    before: ForConditionJson | ErrorJson,
    after: ForConditionJson | ErrorJson,
    sources?: Sources,
): ForConditionValueDiff => {
    if (before.kind === 'error' || after.kind === 'error') {
        if (before.kind === 'error' && after.kind === 'error')
            return makeErrorStatementDiff(before, after);
        return { status: 'changed', before, after };
    }
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
    }) as unknown as ForConditionDiff;
};

export const makeForStatementDiff = (
    before: ForStatementJson,
    after: ForStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): ForStatementDiff =>
    makeNodeDiff('for', before, after, 'slot', (b, a) => ({
        condition: makeForConditionDiff(b.condition, a.condition, sources),
        block: makeStatementValueDiff(b.block, a.block, sources, context),
    })) as unknown as ForStatementDiff;

export const makeIfConditionDiff = (
    before: IfConditionJson,
    after: IfConditionJson,
    sources?: Sources,
): IfConditionDiff =>
    makeNodeDiff('ifCondition', before, after, 'slot', (b, a) => ({
        condition: makeExpressionValueDiff(b.condition, a.condition, sources),
    }));

const makeIfConditionBlockDiff = (
    before: IfConditionBlockJson | ErrorJson,
    after: IfConditionBlockJson | ErrorJson,
    sources?: Sources,
    context?: TypedDiffContext,
):
    | IfConditionBlockDiff
    | ErrorStatementDiff
    | JsonShapeReplacementDiff<IfConditionBlockJson | ErrorJson> => {
    if ('kind' in before || 'kind' in after) {
        if ('kind' in before && 'kind' in after) return makeErrorStatementDiff(before, after);
        return { status: 'changed', before, after };
    }
    if (typeof before.condition === 'string' || typeof after.condition === 'string') {
        if (before.condition === after.condition) {
            return makeStatementObjectDiff(before, after, (b, a) => ({
                condition: 'else',
                block: makeStatementValueDiff(b.block, a.block, sources, context),
            })) as IfConditionBlockDiff;
        }
        return { status: 'changed', before, after };
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
): IfStatementDiff =>
    makeNodeDiff('if', before, after, 'slot', (b, a) => ({
        conditionBlock: makeOptionalDiff(b.conditionBlock, a.conditionBlock, (x, y) => {
            if (!Array.isArray(x) || !Array.isArray(y)) return makeValueDiff(x, y);
            return makeStatementSequenceDiff(x, y, (left, right) =>
                makeIfConditionBlockDiff(left, right, sources, context),
            );
        }),
    })) as unknown as IfStatementDiff;

export const makeInsertStatementDiff = (
    before: InsertStatementJson,
    after: InsertStatementJson,
    sources?: Sources,
): InsertStatementDiff =>
    makeNodeDiff('insert', before, after, 'slot', (b, a) => ({
        field: makeExpressionValueDiff(b.field, a.field, sources),
        accessLevel: makeAccessLevelDiff(b.accessLevel, a.accessLevel),
    })) as unknown as InsertStatementDiff;

export const makeMergeStatementDiff = (
    before: MergeStatementJson,
    after: MergeStatementJson,
    sources?: Sources,
): MergeStatementDiff =>
    makeNodeDiff('merge', before, after, 'slot', (b, a) => ({
        field: makeExpressionListDiff(b.field, a.field, sources),
        accessLevel: makeAccessLevelDiff(b.accessLevel, a.accessLevel),
    })) as unknown as MergeStatementDiff;

export const makeReturnStatementDiff = (
    before: ReturnStatementJson,
    after: ReturnStatementJson,
    sources?: Sources,
): ReturnStatementDiff =>
    makeNodeDiff('return', before, after, 'slot', (b, a) => ({
        field: makeOptionalDiff(b.field, a.field, (x, y) => makeExpressionValueDiff(x, y, sources)),
    })) as unknown as ReturnStatementDiff;

export const makeRunAsConditionDiff = (
    before: RunAsConditionJson,
    after: RunAsConditionJson,
    sources?: Sources,
): RunAsConditionDiff =>
    makeNodeDiff('runAsCondition', before, after, 'slot', (b, a) => ({
        field: makeExpressionListDiff(b.field, a.field, sources),
    }));

const makeRunAsConditionValueDiff = (
    before: RunAsConditionJson | ErrorJson,
    after: RunAsConditionJson | ErrorJson,
    sources?: Sources,
): RunAsConditionValueDiff => {
    if (before.kind === 'error' || after.kind === 'error') {
        return before.kind === 'error' && after.kind === 'error'
            ? makeErrorStatementDiff(before, after)
            : { status: 'changed', before, after };
    }
    return makeRunAsConditionDiff(before, after, sources);
};

export const makeRunAsStatementDiff = (
    before: RunAsStatementJson,
    after: RunAsStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): RunAsStatementDiff =>
    makeNodeDiff('runAs', before, after, 'slot', (b, a) => ({
        condition: makeRunAsConditionValueDiff(b.condition, a.condition, sources),
        block: makeBlockDiffWithContext(b.block, a.block, sources, context),
    })) as unknown as RunAsStatementDiff;

export const makeWhenVariantDiff = (
    before: WhenVariantJson,
    after: WhenVariantJson,
    sources?: Sources,
): WhenVariantDiff =>
    makeNodeDiff('switchVariant', before, after, 'slot', (b, a) => ({
        variant: makeExpressionValueDiff(b.variant, a.variant, sources),
    }));

const makeWhenConditionValueDiff = (
    before: WhenConditionJson['condition'],
    after: WhenConditionJson['condition'],
): WhenConditionValueDiff => {
    if (before === 'else' && after === 'else') {
        return 'else';
    }
    if (before === 'else' || after === 'else') {
        return { status: 'changed', before, after };
    }
    if (Array.isArray(before) && Array.isArray(after)) {
        return makeStatementSequenceDiff(before, after, (b, a) => {
            if (Array.isArray(b.value) !== Array.isArray(a.value)) {
                return { status: 'changed', before: b, after: a };
            }
            return makeStatementObjectDiff(b, a, (x, y) => ({
                value:
                    Array.isArray(x.value) && Array.isArray(y.value)
                        ? makeValueListDiff(x.value, y.value, makeValueDiff)
                        : makeValueDiff(x.value as string, y.value as string),
                valueType: makeValueDiff(x.valueType, y.valueType),
                operator: makeOptionalDiff(
                    'operator' in x ? x.operator : undefined,
                    'operator' in y ? y.operator : undefined,
                    makeValueDiff,
                ),
            }));
        }) as unknown as WhenConditionValueDiff;
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
    return { status: 'changed', before, after };
};

const makeWhenConditionNodeValueDiff = (
    before: WhenConditionJson | ErrorJson,
    after: WhenConditionJson | ErrorJson,
):
    | WhenConditionDiff
    | ErrorStatementDiff
    | JsonShapeReplacementDiff<WhenConditionJson | ErrorJson> => {
    if (before.kind === 'error' || after.kind === 'error') {
        return before.kind === 'error' && after.kind === 'error'
            ? makeErrorStatementDiff(before, after)
            : { status: 'changed', before, after };
    }
    return makeWhenConditionDiff(before, after);
};

export const makeWhenConditionDiff = (
    before: WhenConditionJson,
    after: WhenConditionJson,
): WhenConditionDiff =>
    makeNodeDiff('switchCondition', before, after, 'slot', (b, a) => ({
        condition: makeWhenConditionValueDiff(b.condition, a.condition),
    })) as unknown as WhenConditionDiff;

const makeSwitchBlockDiff = (
    before: SwitchBlockJson | ErrorJson,
    after: SwitchBlockJson | ErrorJson,
    sources?: Sources,
    context?: TypedDiffContext,
): SwitchBlockDiff | ErrorStatementDiff | JsonShapeReplacementDiff<SwitchBlockJson | ErrorJson> => {
    if ('kind' in before || 'kind' in after) {
        if ('kind' in before && 'kind' in after) return makeErrorStatementDiff(before, after);
        return { status: 'changed', before, after };
    }
    return makeStatementObjectDiff(before, after, (b, a) => ({
        condition: makeWhenConditionNodeValueDiff(b.condition, a.condition),
        block: makeBlockDiffWithContext(b.block, a.block, sources, context),
    })) as SwitchBlockDiff;
};

const makeWhenVariantValueDiff = (
    before: WhenVariantJson | ErrorJson,
    after: WhenVariantJson | ErrorJson,
    sources?: Sources,
): WhenVariantDiff | ErrorStatementDiff | JsonShapeReplacementDiff<WhenVariantJson | ErrorJson> => {
    if (before.kind === 'error' || after.kind === 'error') {
        return before.kind === 'error' && after.kind === 'error'
            ? makeErrorStatementDiff(before, after)
            : { status: 'changed', before, after };
    }
    return makeWhenVariantDiff(before, after, sources);
};

export const makeSwitchStatementDiff = (
    before: SwitchStatementJson,
    after: SwitchStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): SwitchStatementDiff =>
    makeNodeDiff('switch', before, after, 'slot', (b, a) => ({
        variant: makeWhenVariantValueDiff(b.variant, a.variant, sources),
        block: makeStatementSequenceDiff(b.block, a.block, (x, y) =>
            makeSwitchBlockDiff(x, y, sources, context),
        ) as SwitchBlockListDiff,
    })) as unknown as SwitchStatementDiff;

export const makeThrowStatementDiff = (
    before: ThrowStatementJson,
    after: ThrowStatementJson,
    sources?: Sources,
): ThrowStatementDiff =>
    makeNodeDiff('throw', before, after, 'slot', (b, a) => ({
        value: makeExpressionValueDiff(b.value, a.value, sources),
    }));

export const makeCatchConditionDiff = (
    before: CatchConditionJson,
    after: CatchConditionJson,
): CatchConditionDiff =>
    makeNodeDiff('catchCondition', before, after, 'slot', (b, a) => ({
        exception: makeValueDiff(b.exception, a.exception),
        exceptionType: makeValueListDiff(b.exceptionType, a.exceptionType, makeValueDiff),
        modifier: makeModifierItemsDiff(
            b.modifier.map((item) => ({ modifierType: 'catch', ...item })),
            a.modifier.map((item) => ({ modifierType: 'catch', ...item })),
        ),
    })) as unknown as CatchConditionDiff;

const makeTryBlockDiff = (
    before: TryBlockJson | ErrorJson,
    after: TryBlockJson | ErrorJson,
    sources?: Sources,
    context?: TypedDiffContext,
): TryBlockDiff | ErrorStatementDiff | JsonShapeReplacementDiff<TryBlockJson | ErrorJson> => {
    if ('kind' in before || 'kind' in after) {
        if ('kind' in before && 'kind' in after) return makeErrorStatementDiff(before, after);
        return { status: 'changed', before, after };
    }
    if (before.condition !== after.condition) return { status: 'changed', before, after };
    if (before.condition === 'catch' && after.condition === 'catch') {
        return makeStatementObjectDiff(before, after, (b, a) => ({
            block: makeBlockDiffWithContext(b.block, a.block, sources, context),
            catchCondition: makeOptionalDiff(b.catchCondition, a.catchCondition, (x, y) =>
                x.kind === 'error' || y.kind === 'error'
                    ? x.kind === 'error' && y.kind === 'error'
                        ? makeErrorStatementDiff(x, y)
                        : { status: 'changed', before: x, after: y }
                    : makeCatchConditionDiff(x, y),
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
): TryStatementDiff =>
    makeNodeDiff('try', before, after, 'slot', (b, a) => ({
        block: makeStatementSequenceDiff(b.block, a.block, (x, y) =>
            makeTryBlockDiff(x, y, sources, context),
        ) as TryBlockListDiff,
    })) as unknown as TryStatementDiff;

export const makeUndeleteStatementDiff = (
    before: UndeleteStatementJson,
    after: UndeleteStatementJson,
    sources?: Sources,
): UndeleteStatementDiff =>
    makeNodeDiff('undelete', before, after, 'slot', (b, a) => ({
        field: makeExpressionValueDiff(b.field, a.field, sources),
        accessLevel: makeAccessLevelDiff(b.accessLevel, a.accessLevel),
    })) as unknown as UndeleteStatementDiff;

export const makeUpdateStatementDiff = (
    before: UpdateStatementJson,
    after: UpdateStatementJson,
    sources?: Sources,
): UpdateStatementDiff =>
    makeNodeDiff('update', before, after, 'slot', (b, a) => ({
        field: makeExpressionValueDiff(b.field, a.field, sources),
        accessLevel: makeAccessLevelDiff(b.accessLevel, a.accessLevel),
    })) as unknown as UpdateStatementDiff;

export const makeUpsertStatementDiff = (
    before: UpsertStatementJson,
    after: UpsertStatementJson,
    sources?: Sources,
): UpsertStatementDiff =>
    makeNodeDiff('upsert', before, after, 'slot', (b, a) => ({
        field: makeExpressionValueDiff(b.field, a.field, sources),
        accessLevel: makeAccessLevelDiff(b.accessLevel, a.accessLevel),
        key: makeOptionalDiff(b.key, a.key, (x, y) => makeValueListDiff(x, y, makeValueDiff)),
    })) as unknown as UpsertStatementDiff;

export const makeWhileConditionDiff = (
    before: WhileConditionJson,
    after: WhileConditionJson,
    sources?: Sources,
): WhileConditionDiff =>
    makeNodeDiff('whileCondition', before, after, 'slot', (b, a) => ({
        condition: makeExpressionValueDiff(b.condition, a.condition, sources),
    }));

const makeWhileConditionValueDiff = (
    before: WhileConditionJson | ErrorJson,
    after: WhileConditionJson | ErrorJson,
    sources?: Sources,
): WhileConditionValueDiff => {
    if (before.kind === 'error' || after.kind === 'error') {
        return before.kind === 'error' && after.kind === 'error'
            ? makeErrorStatementDiff(before, after)
            : { status: 'changed', before, after };
    }
    return makeWhileConditionDiff(before, after, sources);
};

export const makeWhileStatementDiff = (
    before: WhileStatementJson,
    after: WhileStatementJson,
    sources?: Sources,
    context?: TypedDiffContext,
): WhileStatementDiff =>
    makeNodeDiff('while', before, after, 'slot', (b, a) => ({
        condition: makeWhileConditionValueDiff(b.condition, a.condition, sources),
        body: makeStatementValueDiff(b.body, a.body, sources, context),
    })) as unknown as WhileStatementDiff;

export const makeStatementValueDiff = (
    before: StatementValue,
    after: StatementValue,
    sources?: Sources,
    context?: TypedDiffContext,
): StatementValueDiff | StatementReplacementDiff => {
    if (Array.isArray(before) && Array.isArray(after)) {
        return makeBlockDiffWithContext(before, after, sources, context);
    }
    if (Array.isArray(before) || Array.isArray(after)) return { status: 'changed', before, after };
    if (before.kind === 'error' || after.kind === 'error') {
        return before.kind === 'error' && after.kind === 'error'
            ? makeErrorStatementDiff(before, after)
            : { status: 'changed', before, after };
    }
    if (before.kind !== after.kind) return { status: 'changed', before, after };
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
    const localContext =
        context ?? makeTypedDiffContext(before, after, makeGumTreeBlockDiff, sources).context;
    const gumTreeDiffs = makeGumTreeBlockDiff(before, after, sources);
    return makeTypedArrayDiff<StatementValue>(
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

/** 文 1 件の差分。文の内部の式・分岐・ブロックも再帰的に比較する */
export const makeStatementDiff = <Before extends Statement, After extends Statement>(
    before: Before,
    after: After,
    sources?: Sources,
): StatementDiff[] => [
    makeStatementValueDiff(
        before,
        after,
        sources,
        makeTypedDiffContext([before], [after], makeGumTreeBlockDiff, sources).context,
    ) as StatementDiff,
];

/** 宣言やユニット本文が持つ文の並びの差分 */
export const makeBlockDiff: BlockDiffer = (before, after, sources) => {
    return makeBlockDiffWithContext(before as StatementValue[], after as StatementValue[], sources);
};
