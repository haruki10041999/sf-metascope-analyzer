import { ConvertKeys, JsonType, StructureJsonType } from '../../../types';

import {
    compareSourceDistance,
    findNodeSourceInfo,
    getSourceDistance,
    makeConvertKeys,
    SourceDistance,
    SourceObject,
} from '../source';
import { isRecord } from '../../../types/commons/utils';

// 方針: docs/apex-implementation.md

export type JsonNode =
    JsonType<string> | StructureJsonType<string, Record<string, ConvertKeys | ConvertKeys[]>>;

/**
 * 対応付けの根拠。nearest / similar / recovery は推定。
 * similar は GumTree の Bottom-up (dice 係数)、recovery は GumTree の Recovery で対応付けたもの
 */
export type Match = 'identical' | 'key' | 'slot' | 'nearest' | 'similar' | 'recovery';

// union の各要素ごとに Omit する
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type Body<T> = DistributiveOmit<T, 'kind' | 'sourceKeys'>;

export const toBody = <T extends JsonNode>(node: T): Body<T> => {
    const { kind: _kind, sourceKeys: _sourceKeys, ...rest } = node;
    return rest as Body<T>;
};

export const getObjectKey = (node: JsonNode): string => makeConvertKeys(node).objectKey;

/** before / after のソース位置 (Apex の SourceJson、XML の XmlSourceJson のどちらも入る) */
export type Sources = { before: SourceObject[]; after: SourceObject[] };

const quoteKeyString = (value: string): string =>
    `"${value.replace(/[\\"\u0000-\u001f]/g, (character) => {
        switch (character) {
            case '"':
                return '\\"';
            case '\\':
                return '\\\\';
            case '\b':
                return '\\b';
            case '\f':
                return '\\f';
            case '\n':
                return '\\n';
            case '\r':
                return '\\r';
            case '\t':
                return '\\t';
            default:
                return `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`;
        }
    })}"`;

/** kind と sourceKeys を持つ JSON ノード (JsonType / StructureJsonType) か */
export const isNode = (value: unknown): value is JsonNode =>
    typeof value === 'object' && value !== null && 'kind' in value && 'sourceKeys' in value;

/** 値の比較用キー。ネストした JSON ノードも objectKey で比較する */
export const getValueKey = (value: unknown): string => {
    if (isNode(value)) {
        return `node:${getObjectKey(value)}`;
    }
    if (Array.isArray(value)) {
        return `[${value.map(getValueKey).join(',')}]`;
    }
    if (isRecord(value)) {
        // kind を持たない値 (Apex の式・変数など) の sourceKeys は位置なので、値の比較には使わない
        const entries = Object.keys(value)
            .filter((key) => key !== 'sourceKeys')
            .sort((a, b) =>
                a === b ? 0 : a === 'type' ? -1 : b === 'type' ? 1 : a.localeCompare(b),
            );
        return `{${entries
            .map((key) => `${quoteKeyString(key)}:${getValueKey(value[key])}`)
            .join(',')}}`;
    }
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    switch (typeof value) {
        case 'string':
            return quoteKeyString(value);
        case 'number':
            return Number.isFinite(value)
                ? String(value)
                : Number.isNaN(value)
                  ? 'NaN'
                  : value > 0
                    ? 'Infinity'
                    : '-Infinity';
        case 'boolean':
            return value ? 'boolean:true' : 'boolean:false';
        case 'bigint':
            return `bigint:${value}`;
        case 'symbol':
            return `symbol:${String(value.description)}`;
        case 'function':
            return `function:${value.name}`;
        case 'object':
            return `object:${String(value)}`;
    }
    return `other:${String(value)}`;
};

export const isSameValue = (before: unknown, after: unknown): boolean =>
    getValueKey(before) === getValueKey(after);

// ---------------------------------------------------------------------------
// kind / sourceKeys と中身の分離
// ---------------------------------------------------------------------------

/** before / after で同じなら値 1 つ、違えば { before, after } */
export type Pair<T> = T | { before: T; after: T };

/**
 * 対応付いた組の sourceKeys。before / after を、キー (objectKey / sourceKey、StructureJsonType は base / name など) ごとに
 * まとめ、同じ値なら単体、違えば { before, after } にする
 */
export type SourceKeysDiff<K> = K extends string
    ? Pair<string>
    : K extends readonly (infer E)[]
      ? SourceKeysDiff<E>[] | { before: K; after: K }
      : K extends object
        ? { [P in keyof K]: SourceKeysDiff<K[P]> | { before: K[P]; after: K[P] } }
        : Pair<K>;

export const makeSourceKeysDiff = <K>(before: K, after: K): SourceKeysDiff<K> => {
    if (typeof before === 'string' && typeof after === 'string') {
        return (before === after ? before : { before, after }) as SourceKeysDiff<K>;
    }
    if (Array.isArray(before) && Array.isArray(after) && before.length === after.length) {
        return before.map((b, index) => makeSourceKeysDiff(b, after[index])) as SourceKeysDiff<K>;
    }
    if (isRecord(before) && isRecord(after) && !Array.isArray(before) && !Array.isArray(after)) {
        const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
        return Object.fromEntries(
            keys.map((key) => {
                const b = before[key];
                const a = after[key];
                return [
                    key,
                    b === undefined || a === undefined
                        ? { before: b, after: a }
                        : makeSourceKeysDiff(b, a),
                ];
            }),
        ) as SourceKeysDiff<K>;
    }
    return (isSameValue(before, after) ? before : { before, after }) as SourceKeysDiff<K>;
};

type NodeOf<T> = Extract<T, JsonNode>;

/** JSON ノードなら kind / sourceKeys を除いた中身、それ以外はそのまま */
export type Content<T> = T extends JsonNode ? Body<T> : T;

/** 片側だけの値の kind / sourceKeys (値が JSON ノードのときだけ持つ) */
export type NodeKeys<T> = [NodeOf<T>] extends [never]
    ? {}
    : { kind?: NodeOf<T>['kind']; sourceKeys?: NodeOf<T>['sourceKeys'] };

/** 組になった値の kind / sourceKeys。kind は同じなら単体、片方だけが JSON ノードならその側だけを持つ */
export type NodePairKeys<T> = [NodeOf<T>] extends [never]
    ? {}
    : {
          kind?:
              Pair<NodeOf<T>['kind']> | { before?: NodeOf<T>['kind']; after?: NodeOf<T>['kind'] };
          sourceKeys?:
              | SourceKeysDiff<NodeOf<T>['sourceKeys']>
              | { before?: NodeOf<T>['sourceKeys']; after?: NodeOf<T>['sourceKeys'] };
      };

export const toContent = <T>(value: T): Content<T> =>
    (isNode(value) ? toBody(value) : value) as Content<T>;

/** 値が JSON ノードなら { kind, sourceKeys }、そうでなければ {} */
export const getNodeKeys = <T>(value: T): NodeKeys<T> =>
    (isNode(value) ? { kind: value.kind, sourceKeys: value.sourceKeys } : {}) as NodeKeys<T>;

/** 組になった値の { kind, sourceKeys }。どちらも JSON ノードでなければ {} */
export const getNodePairKeys = <T>(before: T, after: T): NodePairKeys<T> => {
    const b = isNode(before) ? before : undefined;
    const a = isNode(after) ? after : undefined;
    if (!b && !a) {
        return {} as NodePairKeys<T>;
    }
    if (b && a) {
        return {
            kind: b.kind === a.kind ? b.kind : { before: b.kind, after: a.kind },
            sourceKeys: makeSourceKeysDiff(b.sourceKeys, a.sourceKeys),
        } as NodePairKeys<T>;
    }
    return {
        kind: b ? { before: b.kind } : { after: a!.kind },
        sourceKeys: b ? { before: b.sourceKeys } : { after: a!.sourceKeys },
    } as NodePairKeys<T>;
};

// ---------------------------------------------------------------------------
// 値・ノードの差分
// ---------------------------------------------------------------------------

/** 形が違う (kind が違う・片方がエラーなど) ときの差分。kind / sourceKeys を分け、中身を丸ごと before / after に持つ */
export type ReplacementDiff<T> = NodePairKeys<T> & {
    status: 'changed';
    before: Content<T>;
    after: Content<T>;
};

export const makeReplacementDiff = <T>(before: T, after: T): ReplacementDiff<T> =>
    ({
        ...getNodePairKeys(before, after),
        status: 'changed',
        before: toContent(before),
        after: toContent(after),
    }) as ReplacementDiff<T>;

/** 値の差分。値が JSON ノードなら kind / sourceKeys を中身から分ける */
export type ValueDiff<T> =
    (NodePairKeys<T> & { status: 'unchanged'; value: Content<T> }) | ReplacementDiff<T>;

export const makeValueDiff = <T>(before: T, after: T): ValueDiff<T> =>
    isSameValue(before, after)
        ? ({
              ...getNodePairKeys(before, after),
              status: 'unchanged',
              value: toContent(before),
          } as ValueDiff<T>)
        : makeReplacementDiff(before, after);

/** 任意項目 (`?`) の差分。両方あれば中の差分、片方だけなら added / removed */
export type OptionalDiff<T, D> =
    | D
    | (NodeKeys<T> & { status: 'added' | 'removed'; value: Content<T> })
    | { status: 'unchanged'; value: undefined };

export const makeOptionalDiff = <T, D>(
    before: T | undefined,
    after: T | undefined,
    makeDiff: (before: T, after: T) => D,
): OptionalDiff<T, D> => {
    if (before === undefined && after === undefined) {
        return { status: 'unchanged', value: undefined };
    }
    if (before === undefined || after === undefined) {
        const value = (before ?? after)!;
        return {
            ...getNodeKeys(value),
            status: before === undefined ? 'added' : 'removed',
            value: toContent(value),
        } as OptionalDiff<T, D>;
    }
    return makeDiff(before, after);
};

/** 一致の判定キー。既定は objectKey。objectKey の外にある情報 (クラスメンバーの修飾子) も見るときに差し替える */
export type Identity<T> = (node: T) => string;

export type NodeDiff<K extends string, T extends JsonNode, Fields> = {
    kind: K;
    sourceKeys: SourceKeysDiff<T['sourceKeys']>;
} & (
    | { status: 'unchanged'; value: Body<T> }
    | { status: 'changed'; match: Match; fields: Fields }
    | {
          status: 'changed';
          match: Match;
          before: Body<T>;
          after: Body<T>;
      }
);

/**
 * 1 組のノードの差分。
 * 判定キー (identity、既定は objectKey) が同じなら unchanged、同じ kind で makeFields が値を返せばプロパティごとの差分、
 * それ以外 (形が違う) は値を丸ごと before / after に入れる。
 */
export const makeNodeDiff = <K extends string, T extends JsonNode & { kind: K }, Fields>(
    kind: K,
    before: T,
    after: T,
    match: Match,
    makeFields: (before: T, after: T) => Fields | undefined,
    identity: Identity<T> = getObjectKey,
): NodeDiff<K, T, Fields> => {
    // T の制約から sourceKeys が広がるため、元の型に戻す
    const sourceKeys = makeSourceKeysDiff(
        before.sourceKeys as T['sourceKeys'],
        after.sourceKeys as T['sourceKeys'],
    );

    if (identity(before) === identity(after)) {
        return { kind, sourceKeys, status: 'unchanged', value: toBody<T>(before) };
    }

    const fields =
        before.kind === kind && after.kind === kind
            ? makeFields(before as T, after as T)
            : undefined;

    if (fields !== undefined) {
        return { kind, sourceKeys, status: 'changed', match, fields };
    }

    return {
        kind,
        sourceKeys,
        status: 'changed',
        match,
        before: toBody<T>(before),
        after: toBody<T>(after),
    };
};

// ---------------------------------------------------------------------------
// 配列の対応付け (B. 集合 / C. 順序付き列 / D. キー対応)
// ---------------------------------------------------------------------------

/** before / after の index の対応 */
export type Pairing =
    | { status: 'unchanged' | 'moved' | 'changed'; match: Match; before: number; after: number }
    | { status: 'removed'; before: number }
    | { status: 'added'; after: number };

export type Distance = (before: number, after: number) => SourceDistance;

const pickNearest = (
    before: number,
    candidates: number[],
    distance: Distance | undefined,
): number | undefined => {
    if (!distance || candidates.length <= 1) {
        return candidates[0];
    }

    let nearest = candidates[0]!;
    let nearestDistance = distance(before, nearest);

    candidates.slice(1).forEach((candidate) => {
        const candidateDistance = distance(before, candidate);

        if (compareSourceDistance(candidateDistance, nearestDistance) < 0) {
            nearest = candidate;
            nearestDistance = candidateDistance;
        }
    });

    return nearest;
};

const sortPairings = (
    pairings: Pairing[],
    sortKey: (p: Pairing) => [number, number, number],
): Pairing[] => {
    return [...pairings].sort((a, b) => {
        const [a0, a1, a2] = sortKey(a);
        const [b0, b1, b2] = sortKey(b);
        return a0 - b0 || a1 - b1 || a2 - b2;
    });
};

/**
 * 順序付き列の並べ方。before の index 順に並べ、added は after で直後にある「対応付いた要素」の直前
 * (= gap の中の changed / removed の後ろ) に置く。before と after の index を混ぜて並べ替えないため。
 */
export const orderPairings = (pairings: Pairing[]): Pairing[] => {
    const paired = pairings.filter(
        (p): p is Extract<Pairing, { before: number; after: number }> =>
            p.status !== 'added' && p.status !== 'removed',
    );

    return sortPairings(pairings, (p) => {
        if (p.status !== 'added') {
            return [p.before, 0, 0];
        }

        const next = paired
            .filter((q) => q.after > p.after)
            .reduce<(typeof paired)[number] | undefined>(
                (min, q) => (min === undefined || q.after < min.after ? q : min),
                undefined,
            );

        return [next ? next.before : Number.MAX_SAFE_INTEGER, -1, p.after];
    });
};

/** 順序に意味がない配列 (集合・キー対応) の並べ方。before の index 順のあとに added を after の index 順で置く */
export const orderUnorderedPairings = (pairings: Pairing[]): Pairing[] => {
    return sortPairings(pairings, (p) =>
        p.status === 'added' ? [Number.MAX_SAFE_INTEGER, 0, p.after] : [p.before, 0, 0],
    );
};

/** 配列の一部 (beforeIndex / afterIndex で取り出したもの) で作った対応を、元の配列の index に戻す */
export const remapPairings = (
    pairings: Pairing[],
    beforeIndex: number[],
    afterIndex: number[],
): Pairing[] => {
    return pairings.map((p): Pairing => {
        if (p.status === 'added') {
            return { ...p, after: afterIndex[p.after]! };
        }
        if (p.status === 'removed') {
            return { ...p, before: beforeIndex[p.before]! };
        }
        return { ...p, before: beforeIndex[p.before]!, after: afterIndex[p.after]! };
    });
};

/** B. 集合: objectKey の一致だけで対応付ける。changed は作らない */
export const pairAsSet = (
    beforeKeys: string[],
    afterKeys: string[],
    distance?: Distance,
): Pairing[] => {
    const pairings: Pairing[] = [];
    const remaining = afterKeys.map((_, index) => index);

    beforeKeys.forEach((key, b) => {
        const candidates = remaining.filter((a) => afterKeys[a] === key);
        const a = pickNearest(b, candidates, distance);

        if (a === undefined) {
            pairings.push({ status: 'removed', before: b });
        } else {
            pairings.push({ status: 'unchanged', match: 'identical', before: b, after: a });
            remaining.splice(remaining.indexOf(a), 1);
        }
    });

    remaining.forEach((a) => pairings.push({ status: 'added', after: a }));

    return orderUnorderedPairings(pairings);
};

/** キーの並びの LCS を取り、一致した [beforeIndex, afterIndex] の組を順に返す */
export const lcs = (before: string[], after: string[]): [number, number][] => {
    const n = before.length;
    const m = after.length;
    // dp[i][j] = before[i..] と after[j..] の LCS の長さ
    const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            dp[i]![j] =
                before[i] === after[j]
                    ? dp[i + 1]![j + 1]! + 1
                    : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
        }
    }

    const pairs: [number, number][] = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (before[i] === after[j]) {
            pairs.push([i, j]);
            i++;
            j++;
        } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
            i++;
        } else {
            j++;
        }
    }
    return pairs;
};

export type SequenceOptions = {
    /** gap の中で組にしてよいか (既定: 常に可) */
    canPair?: ((before: number, after: number) => boolean) | undefined;
    distance?: Distance | undefined;
};

/**
 * C. 順序付き列:
 * 1. objectKey の並びの LCS に入ったものを unchanged
 * 2. LCS に入らなかったが objectKey が同じものを moved
 * 3. 隣り合う unchanged の間 (gap) で canPair なものを、位置が近い順に changed
 * 4. 残りを removed / added
 */
export const pairAsSequence = (
    beforeKeys: string[],
    afterKeys: string[],
    options: SequenceOptions = {},
): Pairing[] => {
    const { canPair = () => true, distance } = options;
    const anchors = lcs(beforeKeys, afterKeys);
    const pairings: Pairing[] = anchors.map(([b, a]) => ({
        status: 'unchanged',
        match: 'identical',
        before: b,
        after: a,
    }));

    const anchoredBefore = new Set(anchors.map(([b]) => b));
    const anchoredAfter = new Set(anchors.map(([, a]) => a));
    const restAfter = afterKeys.map((_, index) => index).filter((a) => !anchoredAfter.has(a));

    const restBefore = beforeKeys
        .map((_, index) => index)
        .filter((b) => !anchoredBefore.has(b))
        .filter((b) => {
            const candidates = restAfter.filter((a) => afterKeys[a] === beforeKeys[b]);
            const a = pickNearest(b, candidates, distance);

            if (a === undefined) {
                return true;
            }

            pairings.push({ status: 'moved', match: 'identical', before: b, after: a });
            restAfter.splice(restAfter.indexOf(a), 1);
            return false;
        });

    const gapOf = (index: number, side: 0 | 1) =>
        anchors.filter((anchor) => anchor[side] < index).length;

    restBefore.forEach((b) => {
        const candidates = restAfter.filter((a) => gapOf(a, 1) === gapOf(b, 0) && canPair(b, a));
        const a = pickNearest(b, candidates, distance);

        if (a === undefined) {
            pairings.push({ status: 'removed', before: b });
        } else {
            pairings.push({
                status: 'changed',
                match: distance ? 'nearest' : 'slot',
                before: b,
                after: a,
            });
            restAfter.splice(restAfter.indexOf(a), 1);
        }
    });

    restAfter.forEach((a) => pairings.push({ status: 'added', after: a }));

    return orderPairings(pairings);
};

/**
 * D. キー対応: 識別キーが同じもの同士を対応付ける。
 * 識別キーを持たないものは集合として比べる。
 */
export const pairByKey = (
    beforeIds: (string | undefined)[],
    afterIds: (string | undefined)[],
    beforeKeys: string[],
    afterKeys: string[],
    distance?: Distance,
): Pairing[] => {
    const pairings: Pairing[] = [];
    const remaining = afterIds.map((_, index) => index).filter((a) => afterIds[a] !== undefined);
    const unkeyedBefore: number[] = [];
    const unkeyedAfter = afterIds.map((_, index) => index).filter((a) => afterIds[a] === undefined);

    beforeIds.forEach((id, b) => {
        if (id === undefined) {
            unkeyedBefore.push(b);
            return;
        }

        const candidates = remaining.filter((a) => afterIds[a] === id);
        const a = pickNearest(b, candidates, distance);

        if (a === undefined) {
            pairings.push({ status: 'removed', before: b });
        } else if (beforeKeys[b] === afterKeys[a]) {
            pairings.push({ status: 'unchanged', match: 'identical', before: b, after: a });
            remaining.splice(remaining.indexOf(a), 1);
        } else {
            pairings.push({ status: 'changed', match: 'key', before: b, after: a });
            remaining.splice(remaining.indexOf(a), 1);
        }
    });

    remaining.forEach((a) => pairings.push({ status: 'added', after: a }));

    const unkeyed = pairAsSet(
        unkeyedBefore.map((b) => beforeKeys[b]!),
        unkeyedAfter.map((a) => afterKeys[a]!),
        distance && ((b, a) => distance(unkeyedBefore[b]!, unkeyedAfter[a]!)),
    );

    return orderUnorderedPairings([
        ...pairings,
        ...remapPairings(unkeyed, unkeyedBefore, unkeyedAfter),
    ]);
};

// ---------------------------------------------------------------------------
// 配列の差分 (JsonNode の配列)
// ---------------------------------------------------------------------------

export type ListItemDiff<K extends string, T extends JsonNode, D> =
    | (D & { index: { before: number; after: number } })
    // 要素自身の kind
    | {
          kind: T['kind'];
          status: 'moved';
          match: Match;
          index: { before: number; after: number };
          sourceKeys: SourceKeysDiff<T['sourceKeys']>;
          value: Body<T>;
      }
    | {
          kind: T['kind'];
          status: 'added' | 'removed';
          index: number;
          sourceKeys: T['sourceKeys'];
          value: Body<T>;
      };

export const makeListDiff = <K extends string, T extends JsonNode, D>(
    kind: K,
    before: T[],
    after: T[],
    pairings: Pairing[],
    makeDiff: (before: T, after: T, match: Match) => D,
): ListItemDiff<K, T, D>[] => {
    return pairings.map((p): ListItemDiff<K, T, D> => {
        if (p.status === 'removed') {
            const b = before[p.before]!;
            return {
                kind: b.kind,
                sourceKeys: b.sourceKeys,
                status: 'removed',
                index: p.before,
                value: toBody(b),
            };
        }

        if (p.status === 'added') {
            const a = after[p.after]!;
            return {
                kind: a.kind,
                sourceKeys: a.sourceKeys,
                status: 'added',
                index: p.after,
                value: toBody(a),
            };
        }

        const b = before[p.before]!;
        const a = after[p.after]!;
        const index = { before: p.before, after: p.after };

        if (p.status === 'moved') {
            return {
                kind: b.kind,
                sourceKeys: makeSourceKeysDiff<T['sourceKeys']>(b.sourceKeys, a.sourceKeys),
                status: 'moved',
                match: p.match,
                index,
                value: toBody(b),
            };
        }

        return { ...makeDiff(b, a, p.match), index };
    });
};

/** sources があれば、before / after の要素間のソース位置の距離を返す関数を作る */
export const makeDistance = (
    before: JsonNode[],
    after: JsonNode[],
    sources: Sources | undefined,
): Distance | undefined => {
    if (!sources) {
        return undefined;
    }

    const beforeInfo = before.map((b) => findNodeSourceInfo(sources.before, b));
    const afterInfo = after.map((a) => findNodeSourceInfo(sources.after, a));

    return (b, a) => getSourceDistance(beforeInfo[b]!, afterInfo[a]!);
};

/** B. 集合 */
export const makeSetDiff = <K extends string, T extends JsonNode, D>(
    kind: K,
    before: T[],
    after: T[],
    makeDiff: (before: T, after: T, match: Match) => D,
    sources?: Sources,
    identity: Identity<T> = getObjectKey,
): ListItemDiff<K, T, D>[] => {
    const pairings = pairAsSet(
        before.map(identity),
        after.map(identity),
        makeDistance(before, after, sources),
    );
    return makeListDiff(kind, before, after, pairings, makeDiff);
};

/** C. 順序付き列。canPair の既定は「kind が同じ」 */
export const makeSequenceDiff = <K extends string, T extends JsonNode, D>(
    kind: K,
    before: T[],
    after: T[],
    makeDiff: (before: T, after: T, match: Match) => D,
    options: {
        sources?: Sources | undefined;
        canPair?: ((before: T, after: T) => boolean) | undefined;
    } = {},
): ListItemDiff<K, T, D>[] => {
    const { sources, canPair = (b: T, a: T) => b.kind === a.kind } = options;
    const pairings = pairAsSequence(before.map(getObjectKey), after.map(getObjectKey), {
        canPair: (b, a) => canPair(before[b]!, after[a]!),
        distance: makeDistance(before, after, sources),
    });
    return makeListDiff(kind, before, after, pairings, makeDiff);
};

/** D. キー対応。getId が undefined を返すものは集合として比べる */
export const makeKeyedDiff = <K extends string, T extends JsonNode, D>(
    kind: K,
    before: T[],
    after: T[],
    makeDiff: (before: T, after: T, match: Match) => D,
    getId: (node: T) => string | undefined,
    sources?: Sources,
    identity: Identity<T> = getObjectKey,
): ListItemDiff<K, T, D>[] => {
    const pairings = pairByKey(
        before.map(getId),
        after.map(getId),
        before.map(identity),
        after.map(identity),
        makeDistance(before, after, sources),
    );
    return makeListDiff(kind, before, after, pairings, makeDiff);
};
