import { SourceInfo } from '../converter';

import { ConvertKeys, JsonType, isJsonType, isStructureJson } from './json';

export type SourceJson = {
    objectKey: string;
    context: string;
    source: ({ sourceKey: string } & Omit<SourceInfo, 'context'>)[];
};

export type SourceRegistration = { objectKey: string; sourceKey: string; sourceInfo: SourceInfo };

export const makeSourceObjects = (registrations: (SourceRegistration | null)[]): SourceJson[] => {
    const sourceObjects = new Map<string, SourceJson>();

    for (const registration of registrations) {
        if (!registration) {
            continue;
        }

        const { objectKey, sourceKey, sourceInfo } = registration;
        const { context, ...content } = sourceInfo;
        const sourceObject = sourceObjects.get(objectKey);

        if (sourceObject) {
            sourceObject.source.push({ sourceKey, ...content });
        } else {
            sourceObjects.set(objectKey, {
                objectKey,
                context,
                source: [{ sourceKey, ...content }],
            });
        }
    }

    return [...sourceObjects.values()];
};

export const findSourceInfo = (
    sourceObject: SourceJson[],
    objectKey: string,
    sourceKey: string,
): SourceInfo => {
    const object = sourceObject.find((object) => object.objectKey === objectKey);

    if (object) {
        const source = object.source.find((source) => source.sourceKey === sourceKey);

        if (source) {
            const { sourceKey: _sourceKey, ...content } = source;

            return {
                context: object.context,
                ...content,
            };
        }
    }

    throw new Error('sourceInfo cannot be found');
};

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
    } else if (isStructureJson(target)) {
        Object.values(target.sourceKeys).forEach((value) => {
            (Array.isArray(value) ? value : [value]).forEach(addKeys);
        });
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

