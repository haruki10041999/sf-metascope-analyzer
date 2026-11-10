import type { SourceSpan } from '../../commons/source';

import { ConvertKeys, JsonType, isJsonType, isStructureJsonType } from '../../commons/json';

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
    } else if (isStructureJsonType(target)) {
        Object.values(target.sourceKeys).forEach((value) => {
            (Array.isArray(value) ? value : [value]).forEach(addKeys);
        });
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

    Object.entries(excludeSourceKeys).forEach(([objectKey, sourceKeys]) => {
        const sourceObject = sourceObjects.find((object) => object.objectKey === objectKey);

        if (sourceObject) {
            const regenerateSource = {
                objectKey: sourceObject.objectKey,
                context: sourceObject.context,
                source: sourceObject.source.filter((source) =>
                    sourceKeys.includes(source.sourceKey),
                ),
            };
            regenerate.push(regenerateSource);
        }
    });

    return regenerate;
};
