import { analyzeObject } from '../processor/Metadata/analysis';
import {
    apexContextOf,
    lwcContextOf,
    type MetadataContext,
} from '../processor/Metadata/references';
import { isSameValue } from '../processor/commons/diff/commons';
import type { CustomLabelsJson, JsonType } from '../types';
import type { MetadataSnapshot, RowBase, ValueChange, ViewStatus } from './types';

// provider で共通の部品

/** 解析結果の名前 (id から <種類>_ を除いたもの) */
export const nameOf = (result: { result: { id: string } }, type: string): string =>
    result.result.id.slice(type.length + 1);

/** 読めた解析結果の JSON */
export const readable = <J>(
    results:
        { dataType: string; filePath: string; result: { id: string; base: unknown } }[] | undefined,
    dataType: string,
): { id: string; filePath: string; json: J }[] =>
    (results ?? []).flatMap((r) =>
        r.dataType === dataType
            ? [{ id: r.result.id, filePath: r.filePath, json: r.result.base as J }]
            : [],
    );

/** 解析結果から、参照先の確かめに使う MetadataContext を作る (snapshot.context にあるものはそちらを使う) */
export const contextOf = (snapshot: MetadataSnapshot | undefined): MetadataContext => {
    if (!snapshot) return {};
    const names = (results: { result: { id: string } }[] | undefined, type: string) =>
        results ? { [type]: results.map((r) => nameOf(r, type)) } : {};
    const labels = readable<CustomLabelsJson>(snapshot.customLabels, 'customLabels').flatMap(
        ({ json }) => (json.labels ?? []).map((label) => label.fullName),
    );
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
        ...(snapshot.flows ? { flows: snapshot.flows.map((r) => nameOf(r, 'flow')) } : {}),
        ...(snapshot.layouts ? { layouts: snapshot.layouts.map((r) => nameOf(r, 'layout')) } : {}),
        ...(snapshot.flexiPages
            ? { flexiPages: snapshot.flexiPages.map((r) => nameOf(r, 'flexiPage')) }
            : {}),
        ...(snapshot.customLabels ? { customLabels: labels } : {}),
        ...(snapshot.permissionSets
            ? { permissionSets: names(snapshot.permissionSets, 'permissionSet').permissionSet! }
            : {}),
        ...(snapshot.mutingPermissionSets
            ? {
                  mutingPermissionSets: names(snapshot.mutingPermissionSets, 'mutingPermissionSet')
                      .mutingPermissionSet!,
              }
            : {}),
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
