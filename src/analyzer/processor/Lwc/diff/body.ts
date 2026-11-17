import type { LwcJsStatementJson } from '../../../types';

import {
    JsonNode,
    NodeDiff,
    OptionalDiff,
    ReplacementDiff,
    Sources,
    ValueDiff,
    getValueKey,
    makeNodeDiff,
    makeOptionalDiff,
    makeReplacementDiff,
    makeValueDiff,
    pairAsSequence,
} from '../../commons/diff/commons';
import {
    TypedListItemDiff,
    TypedObjectDiff,
    makeTypedListDiff,
    makeTypedObjectDiff,
} from '../../commons/diff/list';
import {
    TypedDiffBuilder,
    TypedDiffContext,
    makeTypedArrayDiff,
    makeTypedDiffContext,
} from '../../commons/diff/typed';
import { LWC_GUMTREE_LANGUAGE, makeLwcBlockDiff } from './gumtree/tree';

// LWC の本体 (文の並び) の型ごとの差分 (docs/json-redesign-plan.md 4 章の 5)。
// 出力の形は Apex の本体 (processor/Apex/diff/statement.ts の makeBlockDiff) と同じ:
// - 文の並びは GumTree で対応付けた型付きリスト (TypedListDiff)。別の並びへ移った文は移動先に 1 回だけ moved で出す
// - 対応付いた文は NodeDiff (プロパティごとの差分 fields)。kind が違えば ReplacementDiff
// LWC は文・式の kind が多い (文 20・式 40 ほど) ので、Apex のような kind ごとの関数は書かず、JSON の形から作る:
// - 文の並び (GumTree の isBlockRole と同じ。入れ子の関数の本体も) → 型付きリスト。入れ子の並びも GumTree で対応付け、
//   移動は根の並びで作った context で判定する (Apex と同じ)
// - kind を持つノード → 同じ kind なら NodeDiff、違えば ReplacementDiff。型 (lwcType) は値 (Apex の型と同じく葉)
// - kind を持たない入れ物 (if の分岐・try の節・switch の case など) → TypedObjectDiff
// - そのほかの並び (引数・配列の要素など) → C. 順序付き列 (同じ形のものだけを組にする)
// - 値 (文字列・数・真偽値) → ValueDiff。片方にしかないプロパティ → OptionalDiff の added / removed

/** プロパティごとの差分 (片方にしかないプロパティは added / removed) */
export interface LwcFieldsDiff {
    [key: string]: OptionalDiff<unknown, LwcValueDiff>;
}

/** kind を持つノードの差分 (型は値として比べる) */
export type LwcNodeDiff =
    NodeDiff<string, JsonNode, LwcFieldsDiff> | ReplacementDiff<JsonNode> | ValueDiff<JsonNode>;

/** 並び (文の並び・引数など) の差分 */
export interface LwcListDiff extends Array<TypedListItemDiff<unknown, LwcValueDiff>> {}

/** プロパティの値の差分 */
export type LwcValueDiff =
    | LwcNodeDiff
    | ValueDiff<unknown>
    | TypedObjectDiff<Record<string, unknown>, LwcFieldsDiff>
    | LwcListDiff;

/** 本体の文の並びの差分 (Apex の BlockDiff に当たる) */
export interface LwcStatementBlockDiff extends Array<
    TypedListItemDiff<LwcJsStatementJson, LwcNodeDiff>
> {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isNode = (value: unknown): value is JsonNode =>
    isRecord(value) && typeof value.kind === 'string';

const isBlockRole = (owner: string, role: string): boolean =>
    LWC_GUMTREE_LANGUAGE.isBlockRole?.(owner, role) ?? false;

/** 順序付き列で組にしてよいか (同じ形のもの。入れ物は同じプロパティの組で、try の節の condition なども同じもの) */
const isSameShape = (before: unknown, after: unknown): boolean => {
    if (isNode(before) || isNode(after)) {
        return isNode(before) && isNode(after) && before.kind === after.kind;
    }
    if (isRecord(before) && isRecord(after)) {
        const keys = (value: Record<string, unknown>) => Object.keys(value).sort().join(',');
        if (keys(before) !== keys(after)) return false;
        return (
            typeof before.condition !== 'string' ||
            typeof after.condition !== 'string' ||
            before.condition === after.condition
        );
    }
    if (Array.isArray(before) || Array.isArray(after)) {
        return Array.isArray(before) && Array.isArray(after);
    }
    return typeof before === typeof after;
};

const blockBuilder: TypedDiffBuilder = (before, after, sources) =>
    makeLwcBlockDiff(before as LwcJsStatementJson[], after as LwcJsStatementJson[], sources);

const makeFieldsDiff = (
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    owner: string,
    sources: Sources | undefined,
    context: TypedDiffContext,
): LwcFieldsDiff => {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
        (key) => key !== 'kind' && key !== 'sourceKeys',
    );
    return Object.fromEntries(
        keys.map((key) => [
            key,
            makeOptionalDiff(before[key], after[key], (b, a) =>
                makeValueDiffOf(b, a, owner, key, sources, context),
            ),
        ]),
    );
};

const makeValueDiffOf = (
    before: unknown,
    after: unknown,
    owner: string,
    role: string,
    sources: Sources | undefined,
    context: TypedDiffContext,
): LwcValueDiff => {
    if (Array.isArray(before) && Array.isArray(after)) {
        if (isBlockRole(owner, role)) {
            return makeBlockDiffWithContext(
                before as LwcJsStatementJson[],
                after as LwcJsStatementJson[],
                sources,
                context,
            );
        }
        return makeTypedListDiff(
            before,
            after,
            pairAsSequence(before.map(getValueKey), after.map(getValueKey), {
                canPair: (b, a) => isSameShape(before[b], after[a]),
            }),
            (b, a) => makeValueDiffOf(b, a, owner, role, sources, context),
        ) as LwcListDiff;
    }
    if (isNode(before) && isNode(after)) return makeNodeValueDiff(before, after, sources, context);
    if (isRecord(before) && isRecord(after) && !isNode(before) && !isNode(after)) {
        return makeTypedObjectDiff(before, after, (b, a) =>
            makeFieldsDiff(b, a, `${owner}.${role}`, sources, context),
        );
    }
    return makeValueDiff(before, after);
};

const makeNodeValueDiff = (
    before: JsonNode,
    after: JsonNode,
    sources: Sources | undefined,
    context: TypedDiffContext,
): LwcNodeDiff => {
    if (before.kind !== after.kind) return makeReplacementDiff(before, after);
    // 型は葉 (GumTree と同じく中身で比べる)
    if (before.kind === 'lwcType') return makeValueDiff(before, after);
    return makeNodeDiff(before.kind, before, after, 'slot', (b, a) =>
        makeFieldsDiff(
            b as unknown as Record<string, unknown>,
            a as unknown as Record<string, unknown>,
            before.kind,
            sources,
            context,
        ),
    );
};

const makeBlockDiffWithContext = (
    before: LwcJsStatementJson[],
    after: LwcJsStatementJson[],
    sources: Sources | undefined,
    context?: TypedDiffContext,
): LwcStatementBlockDiff => {
    // 根の並びでは、移動の情報 (context) を作るときの GumTree の結果をそのまま使う
    const { gumTreeDiffs, context: localContext } = context
        ? { gumTreeDiffs: blockBuilder(before, after, sources), context }
        : makeTypedDiffContext(before, after, blockBuilder, sources);
    return makeTypedArrayDiff<LwcJsStatementJson, LwcNodeDiff>(
        before,
        after,
        blockBuilder,
        (b, a, itemSources, itemContext) =>
            makeNodeValueDiff(
                b as unknown as JsonNode,
                a as unknown as JsonNode,
                itemSources,
                itemContext ?? localContext,
            ),
        sources,
        localContext,
        gumTreeDiffs,
    ) as LwcStatementBlockDiff;
};

/** 本体 (メソッド・関数・モジュールの直下) の文の並びの差分 */
export const makeLwcStatementBlockDiff = (
    before: LwcJsStatementJson[],
    after: LwcJsStatementJson[],
    sources?: Sources,
): LwcStatementBlockDiff => makeBlockDiffWithContext(before, after, sources);
