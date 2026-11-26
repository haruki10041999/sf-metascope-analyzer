import { type UnitBaseJsonMap, type UnitBaseType, unitBaseOf } from '../parser/unitBase';
import { analyzeObject } from '../processor/Metadata/analysis';
import {
    apexContextOf,
    lwcContextOf,
    type MetadataContext,
} from '../processor/Metadata/references';
import { isSameValue } from '../processor/commons/diff/commons';
import type { JsonType } from '../types';
import type { MetadataSnapshot, RowBase, ValueChange, ViewStatus } from './types';

// provider で共通の部品

/** 解析結果の名前 (id から <種類>_ を除いたもの) */
export const nameOf = (result: { result: { id: string } }, type: string): string =>
    result.result.id.slice(type.length + 1);

/** 読めた解析結果の JSON (中身の型は種類から引く。parser/unitBase.ts) */
export const readable = <K extends UnitBaseType>(
    results:
        { dataType: string; filePath: string; result: { id: string; base: unknown } }[] | undefined,
    dataType: K,
): { id: string; filePath: string; json: UnitBaseJsonMap[K] }[] =>
    (results ?? []).flatMap((r) => {
        const json = unitBaseOf(r, dataType);
        return json ? [{ id: r.result.id, filePath: r.filePath, json }] : [];
    });

/** スナップショットごとの MetadataContext (provider ごとに作り直さない。大きいリポジトリでオブジェクトの解析などが重い) */
const contexts = new WeakMap<MetadataSnapshot, MetadataContext>();

export const contextOf = (snapshot: MetadataSnapshot | undefined): MetadataContext => {
    if (!snapshot) return {};
    const cached = contexts.get(snapshot);
    if (cached) return cached;
    const context = buildContext(snapshot);
    contexts.set(snapshot, context);
    return context;
};

/** 解析結果から、種類の中の決まりの確かめに使う MetadataContext を作る (snapshot.context にあるものはそちらを使う) */
const buildContext = (snapshot: MetadataSnapshot): MetadataContext => {
    return {
        ...(snapshot.objects
            ? {
                  objects: snapshot.objects.flatMap((r) =>
                      r.dataType === 'object' ? [analyzeObject(r.result.base)] : [],
                  ),
              }
            : {}),
        ...(snapshot.apex ? apexContextOf(snapshot.apex) : {}),
        ...(snapshot.lwc ? lwcContextOf(snapshot.lwc) : {}),
        ...snapshot.context,
    };
};

/** before / after の組 (キーで対応付けたもの) */
export type Compared<T> = {
    key: string;
    before?: T;
    after?: T;
    /** before を渡したときだけ持つ */
    status?: ViewStatus;
};

/** JSON ノードなら objectKey、そうでなければ値で同じか比べる */
const sameNode = (before: unknown, after: unknown): boolean => {
    const keyOf = (value: unknown) =>
        typeof value === 'object' && value !== null && 'sourceKeys' in value
            ? (value as JsonType<string>).sourceKeys.objectKey
            : undefined;
    const b = keyOf(before);
    const a = keyOf(after);
    return b !== undefined && a !== undefined ? b === a : isSameValue(before, after);
};

/**
 * キーで対応付ける。hasBefore が false (before を渡していない) なら after だけを status なしで返す。
 * 並びは after の順のあとに、removed を before の順で置く
 */
export const compareKeyed = <T>(
    before: T[] | undefined,
    after: T[] | undefined,
    key: (item: T) => string,
    hasBefore: boolean,
    same: (before: T, after: T) => boolean = sameNode,
): Compared<T>[] => {
    const afterItems = after ?? [];
    if (!hasBefore) return afterItems.map((item) => ({ key: key(item), after: item }));
    const beforeMap = new Map((before ?? []).map((item) => [key(item), item]));
    const afterKeys = new Set(afterItems.map(key));
    return [
        ...afterItems.map((item): Compared<T> => {
            const k = key(item);
            const b = beforeMap.get(k);
            if (b === undefined) return { key: k, after: item, status: 'added' };
            return {
                key: k,
                before: b,
                after: item,
                status: same(b, item) ? 'unchanged' : 'changed',
            };
        }),
        ...(before ?? [])
            .filter((item) => !afterKeys.has(key(item)))
            .map((item): Compared<T> => ({ key: key(item), before: item, status: 'removed' })),
    ];
};

/** 値の違うプロパティ (kind・sourceKeys と ignore は見ない) */
export const changedProps = (
    before: object | undefined,
    after: object | undefined,
    ignore: string[] = [],
): ValueChange[] => {
    const b = (before ?? {}) as Record<string, unknown>;
    const a = (after ?? {}) as Record<string, unknown>;
    const skip = new Set(['kind', 'sourceKeys', ...ignore]);
    return [...new Set([...Object.keys(b), ...Object.keys(a)])]
        .filter((name) => !skip.has(name) && !isSameValue(b[name], a[name]))
        .map((name) => ({
            name,
            ...(b[name] !== undefined ? { before: b[name] } : {}),
            ...(a[name] !== undefined ? { after: a[name] } : {}),
        }));
};

/** 行の共通部分 (status と、after があれば after の、なければ before の位置) */
export const rowBase = (
    compared: { status?: ViewStatus },
    node: { sourceKeys?: JsonType<string>['sourceKeys'] } | undefined,
    filePath: string | undefined,
): RowBase => ({
    ...(compared.status ? { status: compared.status } : {}),
    ...(filePath !== undefined ? { filePath } : {}),
    ...(node?.sourceKeys ? { sourceKeys: node.sourceKeys } : {}),
});
