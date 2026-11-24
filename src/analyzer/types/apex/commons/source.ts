import type { SourceSpan } from '../../commons/source';

import { ConvertKeys, JsonType, isJsonType } from '../../commons/json';

export type SourceJson = {
    objectKey: string;
    context: string;
    source: ({ sourceKey: string } & Omit<SourceSpan, 'context'>)[];
};

const isConvertKeys = (value: unknown): value is ConvertKeys =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ConvertKeys).objectKey === 'string' &&
    typeof (value as ConvertKeys).sourceKey === 'string';

const _gatherSourceKeys = (target: unknown, allKeys: Record<string, string[]>): void => {
    if (Array.isArray(target)) {
        for (const item of target) {
            _gatherSourceKeys(item, allKeys);
        }
        return;
    }

    if (target === null || typeof target !== 'object') {
        return;
    }

    const addKeys = (keys: ConvertKeys) => {
        (allKeys[keys.objectKey] ??= []).push(keys.sourceKey);
    };

    if (isJsonType(target)) {
        addKeys(target.sourceKeys);
    } else if (isConvertKeys((target as { sourceKeys?: unknown }).sourceKeys)) {
        // kind を持たない値 (式・変数) の位置
        addKeys((target as { sourceKeys: ConvertKeys }).sourceKeys);
    }

    // sourceKeys 自体は登録済みのため、それ以外のプロパティだけを1回ずつ辿る
    for (const [key, value] of Object.entries(target)) {
        if (key !== 'sourceKeys') {
            _gatherSourceKeys(value, allKeys);
        }
    }
};

const gatherSourceKeys = (target: unknown) => {
    let allKeys: Record<string, string[]> = {};
    _gatherSourceKeys(target, allKeys);
    return allKeys;
};

export const regenerateSourceObjects = (
    sourceObjects: SourceJson[],
    target: unknown,
): SourceJson[] => {
    const excludeSourceKeys: Record<string, string[]> = gatherSourceKeys(target);

    const regenerate: SourceJson[] = [];
    // objectKey → 最初の位置の一覧 (キーごとに一覧を頭から探すと、ノードの数の二乗の時間になる)
    const byObjectKey = new Map<string, SourceJson>();
    // sourceKey → それを持つ位置の一覧 (IR に対応するノードがない JSON が、位置を借りた元のノードを探す)
    const bySourceKey = new Map<string, SourceJson>();
    for (const object of sourceObjects) {
        if (!byObjectKey.has(object.objectKey)) byObjectKey.set(object.objectKey, object);
        for (const source of object.source) {
            if (!bySourceKey.has(source.sourceKey)) bySourceKey.set(source.sourceKey, object);
        }
    }

    Object.entries(excludeSourceKeys).forEach(([objectKey, sourceKeys]) => {
        const sourceObject = byObjectKey.get(objectKey);

        if (sourceObject) {
            const used = new Set(sourceKeys);
            const regenerateSource = {
                objectKey: objectKey,
                context: sourceObject.context,
                source: sourceObject.source.filter((source) => used.has(source.sourceKey)),
            };
            regenerate.push(regenerateSource);
            return;
        }

        // IR に対応するノードがない JSON (commons/node.ts の makeDerivedNodeJson)。objectKey は中身から作るので、
        // 中身が同じなら別の場所でも同じキーになる。位置を借りた元のノードごとに、そのノードの文字列と位置で載せる
        const byBase = new Map<SourceJson, Set<string>>();
        for (const sourceKey of sourceKeys) {
            const base = bySourceKey.get(sourceKey);
            if (base) byBase.set(base, (byBase.get(base) ?? new Set()).add(sourceKey));
        }
        for (const [base, used] of byBase) {
            regenerate.push({
                objectKey: objectKey,
                context: base.context,
                source: base.source.filter((source) => used.has(source.sourceKey)),
            });
        }
    });

    return regenerate;
};
