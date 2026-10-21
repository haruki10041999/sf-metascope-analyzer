import crypto from 'node:crypto';

import typia from 'typia';

import { SourceInfo, ErrorInfo, CommonType, isSourceInfo, isErrorInfo } from './converter';

export type JsonType<T extends CommonType> = {
    objectKey: string;
    sourceKey: string;
} & Omit<T, 'sourceInfo'>;

export const isJsonType = <T extends CommonType>(
    target: unknown,
    isType: (target: unknown) => target is T,
): target is JsonType<T> => {
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
    ? JsonType<T>
    : T extends readonly (infer TItem)[]
      ? RewriteJson<TItem>[]
      : T extends object
        ? { [K in keyof T]: RewriteJson<T[K]> }
        : T;

export const convertJson = async <T>(
    target: unknown,
    sourceObject: SourceJson[],
): Promise<RewriteJson<T>> => {
    if (Array.isArray(target))
        return target.map((item) => convertJson(item, sourceObject)) as RewriteJson<T>;

    if (target === null || typeof target !== 'object') {
        return target as RewriteJson<T>;
    }

    if (isCommonType(target)) {
        const { objectKey, sourceKey } = await makeHashKeys(target);

        const { sourceInfo, ...content } = target;

        registerSourceJson(sourceObject, objectKey, sourceKey, sourceInfo);

        return {
            objectKey: objectKey,
            sourceKey: sourceKey,
            ...content,
        } as RewriteJson<T>;
    }

    const node = target as Record<string, unknown>;
    return Object.fromEntries(
        Object.entries(node)
            .filter(([_, value]) => !isSourceInfo(value))
            .map(([key, child]) => [key, convertJson(child, sourceObject)]),
    ) as RewriteJson<T>;
};

export const extractErrors = <T>(target: unknown, errors: JsonType<ErrorInfo>[]): void => {
    if (Array.isArray(target)) {
        target.forEach((item) => extractErrors(item, errors));
        return;
    }

    if (target === null || typeof target !== 'object') {
        return;
    }

    if (isJsonType(target, isErrorInfo)) {
        errors.push(target);
        return;
    }

    const node = target as Record<string, unknown>;

    Object.values(node).forEach((child) => {
        extractErrors(child, errors);
    });
};

export const findSourceInfo = (
    sourceObject: SourceJson[],
    objectKey: string,
    sourceKey: string,
): SourceInfo => {
    const object = sourceObject.find((object) => object.objectKey === objectKey);
    if (object) {
        const context = object.context;

        const source = object.source.find((source) => (source.sourceKey = sourceKey));

        if (source) {
            return {
                context: context,
                ...source,
            };
        }
    }

    throw new Error('sourceIno can not be found');
};

export const outputError = <T, TOutput>(
    target: T | ErrorInfo,
    process: (target: T) => TOutput,
): TOutput | ErrorInfo => {
    if (isErrorInfo(target)) {
        return target;
    }
    return process(target);
};

export const outputErrorList = <T, TOutput>(
    targets: (T | ErrorInfo)[],
    process: (target: T) => TOutput,
): (TOutput | ErrorInfo)[] => {
    return targets.map((target) => outputError(target, process));
};
