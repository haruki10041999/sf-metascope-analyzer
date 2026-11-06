import { PropertiesOf, PropertySchema } from '../../../types';

import {
    Body,
    Content,
    JsonNode,
    NodeKeys,
    ValueDiff,
    getNodeKeys,
    getValueKey,
    isNode,
    makeValueDiff,
    pairAsSequence,
    pairAsSet,
    toBody,
    toContent,
} from './commons';
import { TypedListDiff, makeTypedListDiff } from './list';

// 方針: docs/metadata-diff-policy.md
// 分類 (A〜D)、status、match、出力の型は Apex と同じ (docs/apex-json-diff-policy.md)。共通部品も Apex のものを使う。

/** 配列の要素。JSON ノードなら kind / sourceKeys を中身 (value) から分ける */
export type SplitItem<E> = E extends JsonNode
    ? { kind: E['kind']; sourceKeys: E['sourceKeys']; value: Body<E> }
    : E;

/** 片方にだけある値。配列なら要素ごとに kind / sourceKeys を分け、JSON ノードなら kind / sourceKeys を外に出す */
type PresentValue<T> = T extends readonly (infer E)[] ? SplitItem<E>[] : Content<T>;

/**
 * ファイルにないことがある値 (`?`) の差分。両方になければプロパティごと持たない (makePresentDiff が undefined を返す)。
 * 片方にだけあれば (子の配列ならフォルダごと) added / removed、両方にあれば中の差分
 */
export type PresentDiff<T, D> =
    D | (NodeKeys<T> & { status: 'added' | 'removed'; value: PresentValue<T> });

const splitItem = (item: unknown): unknown =>
    isNode(item) ? { kind: item.kind, sourceKeys: item.sourceKeys, value: toBody(item) } : item;

export const makePresentDiff = <T, D>(
    before: T | undefined,
    after: T | undefined,
    makeDiff: (before: T, after: T) => D,
): PresentDiff<T, D> | undefined => {
    if (before === undefined && after === undefined) {
        return undefined;
    }
    if (before !== undefined && after !== undefined) {
        return makeDiff(before, after);
    }
    const value = (before ?? after)!;
    return {
        ...getNodeKeys(value),
        status: before === undefined ? 'added' : 'removed',
        value: Array.isArray(value) ? value.map(splitItem) : toContent(value),
    } as PresentDiff<T, D>;
};

/** 差分が undefined (両方にない) ならプロパティを持たない { key: diff } */
export const presentEntry = <K extends string, D>(
    key: K,
    diff: D | undefined,
): Partial<Record<K, D>> => (diff === undefined ? {} : ({ [key]: diff } as Record<K, D>));

/** スキーマにある値ごとの差分。両方にない値のプロパティは持たない */
export type PropertiesDiff<S extends PropertySchema> = {
    [K in keyof S]?: PresentDiff<
        NonNullable<PropertiesOf<S>[K]>,
        ValueDiff<NonNullable<PropertiesOf<S>[K]>>
    >;
};

export const makePropertiesDiff = <S extends PropertySchema>(
    schema: S,
    before: PropertiesOf<S>,
    after: PropertiesOf<S>,
): PropertiesDiff<S> =>
    Object.fromEntries(
        Object.keys(schema).flatMap((key) => {
            const diff = makePresentDiff(before[key], after[key], makeValueDiff);
            return diff === undefined ? [] : [[key, diff]];
        }),
    ) as unknown as PropertiesDiff<S>;

/** C. 順序付き列 (リストビューの列・項目セットの項目など、並び順が表示順になるもの)。要素は値として比べる */
export const makeOrderedValuesDiff = <T>(before: T[], after: T[]): TypedListDiff<T, ValueDiff<T>> =>
    makeTypedListDiff(
        before,
        after,
        pairAsSequence(before.map(getValueKey), after.map(getValueKey), { canPair: () => true }),
        makeValueDiff,
    );

/** B. 集合 (順序に意味がないもの)。changed は作らない */
export const makeUnorderedValuesDiff = <T>(before: T[], after: T[]): TypedListDiff<T, never> =>
    makeTypedListDiff(
        before,
        after,
        pairAsSet(before.map(getValueKey), after.map(getValueKey)),
        () => undefined as never,
    );

/**
 * C. 名前の順序付き列 (項目名・identifier の表示順など)。同じ名前同士だけを組にし (違う名前を値の変更にしない)、
 * 順序の変化は moved、増減は added / removed
 */
export const makeOrderedNamesDiff = (
    before: string[],
    after: string[],
): TypedListDiff<string, ValueDiff<string>> =>
    makeTypedListDiff(
        before,
        after,
        pairAsSequence(before.map(getValueKey), after.map(getValueKey), { canPair: () => false }),
        makeValueDiff,
    );
