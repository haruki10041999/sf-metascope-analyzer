import crypto from 'node:crypto';

import typia from 'typia';

import { SourceInfo, ErrorInfo, CommonType, isSourceInfo, isErrorInfo } from './converter';

export type Convert<T extends CommonType> = {
    objectKey: string;
    sourceKey: string;
} & Omit<T, 'sourceInfo'>;

export type JsonType = {
    kind: string;
    souceKeys: Record<string, string[]>;
};

export const writeSourceKeys = <T extends JsonType>(
    target: T,
    objectKey: string,
    sourceKey: string,
): void => {
    if (!Object.keys(target.souceKeys)) {
        target.souceKeys[objectKey] = [sourceKey];
    } else {
        target.souceKeys[objectKey]!.push(sourceKey);
    }
};

export type ErrorJson = JsonType & {
    kind: 'error';
    kindType: string;
};

export const isErrorJson = typia.createIs<ErrorJson>();

export const isConvert = <T extends CommonType>(
    target: unknown,
    isType: (target: unknown) => target is T,
): target is Convert<T> => {
    if (target === null || typeof target !== 'object' || Array.isArray(target)) {
        return false;
    }

    const record = target as Record<string, unknown>;

    const hasObjectKey = typeof record.objectKey === 'string';
    const hasSourceKey = typeof record.sourceKey === 'string';

    if (!hasObjectKey || !hasSourceKey) {
        return false;
    }

    const { objectKey: _objectKey, sourceKey: _sourceKey, ...content } = record;

    const alternativeSourceInfo: SourceInfo = {
        context: '',
        start: { offset: 0, line: 0, column: 0 },
        end: { offset: 0, line: 0, column: 0 },
    };

    const validateTarget = {
        ...content,
        sourceInfo: alternativeSourceInfo,
    };

    return isType(validateTarget);
};

export type SourceJson = {
    objectKey: string;
    context: string;
    source: ({ sourceKey: string } & Omit<SourceInfo, 'context'>)[];
};

const registerSourceJson = (
    sourceObjects: SourceJson[],
    objectKey: string,
    sourceKey: string,
    sourceInfo: SourceInfo,
) => {
    const { context, ...content } = sourceInfo;
    const sourceObject = sourceObjects.find((item) => item.objectKey === objectKey);

    if (!sourceObject) {
        sourceObjects.push({
            objectKey,
            context: context,
            source: [{ sourceKey, ...content }],
        });
    } else {
        sourceObject.source.push({ sourceKey, ...content });
    }
};

const isCommonType = typia.createIs<CommonType>();

export const makeHashKeys = async <T extends CommonType>(
    target: T,
): Promise<{ objectKey: string; sourceKey: string }> => {
    const { sourceInfo, ...rest } = target;
    const { type, ...content } = rest;

    const contentJson = JSON.stringify(content);
    const sourceJson = JSON.stringify(sourceInfo);

    const objextHash = await crypto.webcrypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(contentJson),
    );
    const objectHashHex = Array.from(new Uint8Array(objextHash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    const objectKey = `${type}_${objectHashHex}`;

    const sourceHash = await crypto.webcrypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(sourceJson),
    );
    const sourceHashHex = Array.from(new Uint8Array(sourceHash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    const sourceKey = `${type}_${sourceHashHex}`;

    return {
        objectKey: objectKey,
        sourceKey: sourceKey,
    };
};

export type RewriteJson<T> = T extends CommonType
    ? Convert<T>
    : T extends readonly (infer TItem)[]
      ? RewriteJson<TItem>[]
      : T extends object
        ? { [K in keyof T]: RewriteJson<T[K]> }
        : T;

export const convertJson = async <T>(
    target: unknown,
    sourceObject: SourceJson[],
): Promise<RewriteJson<T>> => {
    if (Array.isArray(target)) {
        return (await Promise.all(
            target.map((item) => convertJson(item, sourceObject)),
        )) as RewriteJson<T>;
    }

    if (target === null || typeof target !== 'object') {
        return target as RewriteJson<T>;
    }

    if (isCommonType(target)) {
        const { objectKey, sourceKey } = await makeHashKeys(target);
        const { sourceInfo, ...content } = target;

        registerSourceJson(sourceObject, objectKey, sourceKey, sourceInfo);

        return {
            objectKey,
            sourceKey,
            ...content,
        } as RewriteJson<T>;
    }

    const node = target as Record<string, unknown>;

    const entries = await Promise.all(
        Object.entries(node)
            .filter(([, value]) => !isSourceInfo(value))
            .map(async ([key, child]) => [key, await convertJson(child, sourceObject)] as const),
    );

    return Object.fromEntries(entries) as RewriteJson<T>;
};

const _searchConvertAll = (target: unknown, jsonObjects: Convert<CommonType>[]): void => {
    if (Array.isArray(target)) {
        target.forEach((item) => _searchConvertAll(item, jsonObjects));
        return;
    }

    if (target === null || typeof target !== 'object') {
        return;
    }

    if (isConvert(target, isCommonType)) {
        jsonObjects.push(target);
    }

    const node = target as Record<string, unknown>;

    Object.values(node).forEach((child) => {
        _searchConvertAll(child, jsonObjects);
    });
};

export const searchConvertAll = <T extends Convert<CommonType>>(
    target: T,
): Convert<CommonType>[] => {
    const convertTypes: Convert<CommonType>[] = [];
    _searchConvertAll(target, convertTypes);
    return convertTypes;
};

export const isError = (target: Convert<CommonType>[]): boolean => {
    return target.some((t) => isConvert(target, isErrorInfo));
};

export const removeSourceInfo = (
    sourceObjects: SourceJson[],
    sourceKeys: Record<string, string[]> | Convert<CommonType>[],
    excludeSourceKeys?: string[],
): void => {
    let targetRecord: Record<string, string[]>;
    if (Array.isArray(sourceKeys)) {
        targetRecord = {};
        sourceKeys.forEach((v) => {
            if (!Object.keys(targetRecord).includes(v.objectKey)) {
                targetRecord[v.objectKey] = [v.sourceKey];
            } else {
                targetRecord[v.objectKey]!.push(v.sourceKey);
            }
        });
    } else {
        targetRecord = sourceKeys;
    }

    Object.entries(targetRecord).forEach(([key, value]) => {
        const sourceIndex = sourceObjects.findIndex((object) => object.objectKey === key);

        if (sourceIndex === -1) {
            return;
        }

        const sourceObject = sourceObjects[sourceIndex]!;

        let filteringSourceKeys = value;
        if (excludeSourceKeys && excludeSourceKeys.length > 0) {
            filteringSourceKeys = value.filter((v) => !excludeSourceKeys!.includes(v));
        }

        sourceObject.source = sourceObject.source.filter(
            (source) => !filteringSourceKeys.includes(source.sourceKey),
        );

        if (sourceObject.source.length === 0) {
            sourceObjects.splice(sourceIndex, 1);
        }
    });
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
