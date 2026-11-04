import {
    Content,
    JsonNode,
    Match,
    NodeKeys,
    NodePairKeys,
    Pairing,
    getNodeKeys,
    getNodePairKeys,
    toContent,
} from './commons';

// 方針: docs/apex-json-diff-policy.md 5 章 (配列の要素の差分を 1 段にする形)。Apex / メタデータ / LWC で共通

/** 移動元。移動したノードは移動先に 1 回だけ出し、移動元をここに持つ (GumTree で対応付けた文の並びで使う) */
export type MovedFrom = {
    parent: string;
    index: number;
    parentSourceKeys?: JsonNode['sourceKeys'];
};

type Index = { before: number; after: number };

/** kind / sourceKeys を持たない object (if の節、変数など) の差分 */
export type TypedObjectDiff<T extends object, Fields> =
    | { status: 'unchanged'; value: T }
    | { status: 'changed'; fields: Fields }
    | { status: 'changed'; before: T; after: T };

/**
 * 配列の要素の差分。要素が JSON ノードなら kind / sourceKeys を中身 (value / fields) から分けて持つ。
 * 中身が変わった組は、要素の差分 (NestedDiff) に対応付けの根拠 (match) と位置 (index) を足した形にする
 */
export type TypedListItemDiff<T, NestedDiff> =
    | (NodePairKeys<T> & { status: 'unchanged'; match: Match; index: Index; value: Content<T> })
    | (NodePairKeys<T> & {
          status: 'moved';
          match: Match;
          index: Index;
          value: Content<T>;
          from?: MovedFrom;
      })
    // 移動して中身も変わったものは changed にして、moved に移動元を持つ
    | (NestedDiff & { match: Match; index: Index; moved?: MovedFrom })
    | (NodeKeys<T> & { status: 'added' | 'removed'; index: number; value: Content<T> });

export type TypedListDiff<T, NestedDiff> = TypedListItemDiff<T, NestedDiff>[];

/** 内容が同じ組 */
export const makeUnchangedItem = <T, D>(
    before: T,
    after: T,
    match: Match,
    index: Index,
): TypedListItemDiff<T, D> =>
    ({
        ...getNodePairKeys(before, after),
        status: 'unchanged',
        match,
        index,
        value: toContent(after),
    }) as TypedListItemDiff<T, D>;

/** 片方にだけある要素 */
export const makeSingleItem = <T, D>(
    status: 'added' | 'removed',
    value: T,
    index: number,
): TypedListItemDiff<T, D> =>
    ({ ...getNodeKeys(value), status, index, value: toContent(value) }) as TypedListItemDiff<T, D>;

/**
 * 対応付いた組 (changed / moved)。要素の差分 diff に match / index を足す。
 * 中身が同じまま移動したものは moved、中身も変わったものは changed (移動していれば moved に移動元) にする
 */
export const makePairedItem = <T, D>(
    diff: D,
    status: 'changed' | 'moved',
    match: Match,
    index: Index,
    from?: MovedFrom,
): TypedListItemDiff<T, D> => {
    const nested = diff as D & { status?: unknown };
    if (nested.status === 'changed') {
        return {
            ...nested,
            match,
            index,
            ...(status === 'moved' && from ? { moved: from } : {}),
        } as TypedListItemDiff<T, D>;
    }
    if (status === 'moved') {
        return {
            ...nested,
            status: 'moved',
            match,
            index,
            ...(from ? { from } : {}),
        } as TypedListItemDiff<T, D>;
    }
    return { ...nested, match, index } as TypedListItemDiff<T, D>;
};

/** 対応 (Pairing) を型付きリスト Diff にする。changed / moved の組だけ makeDiff で中を比べる */
export const makeTypedListDiff = <T, D>(
    before: T[],
    after: T[],
    pairings: Pairing[],
    makeDiff: (before: T, after: T) => D,
): TypedListDiff<T, D> =>
    pairings.map((pairing) => {
        if (pairing.status === 'removed') {
            return makeSingleItem<T, D>('removed', before[pairing.before]!, pairing.before);
        }
        if (pairing.status === 'added') {
            return makeSingleItem<T, D>('added', after[pairing.after]!, pairing.after);
        }
        const b = before[pairing.before]!;
        const a = after[pairing.after]!;
        const index = { before: pairing.before, after: pairing.after };
        if (pairing.status === 'unchanged') {
            return makeUnchangedItem<T, D>(b, a, pairing.match, index);
        }
        return makePairedItem<T, D>(makeDiff(b, a), pairing.status, pairing.match, index);
    });
