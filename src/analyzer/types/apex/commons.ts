import crypto from 'node:crypto';

import typia from 'typia';

import {
    SourceInfo,
    ErrorInfo,
    CommonType,
    isSourceInfo,
    isErrorInfo,
    ValueRuleValue,
} from './converter';

type RewriteCommonTypeExtractContent<T> = T extends CommonType
    ? CommonTypeExtractContent<T>
    : T extends readonly (infer TItem)[]
      ? RewriteCommonTypeExtractContent<TItem>[]
      : T extends object
        ? { [K in keyof T]: RewriteCommonTypeExtractContent<T[K]> }
        : T;

type RewriteCommonTypeExtractSourceKey<T> = T extends CommonType
    ? CommonTypeExtractSourceKey<T>
    : T extends readonly (infer TItem)[]
      ? RewriteCommonTypeExtractSourceKey<TItem>[]
      : T extends object
        ? { [K in keyof T]: RewriteCommonTypeExtractSourceKey<T[K]> }
        : T;

type RewriteConvert<T> = T extends CommonType
    ? Convert<T>
    : T extends readonly (infer TItem)[]
      ? RewriteConvert<TItem>[]
      : T extends object
        ? { [K in keyof T]: RewriteConvert<T[K]> }
        : T;

type RewriteConvertExcludeError<T> = T extends CommonType
    ? ConvertExcludeError<T>
    : T extends readonly (infer U)[]
      ? RewriteConvertExcludeError<U>[]
      : T extends object
        ? {
              [
                  K in keyof T as RewriteConvertExcludeError<T[K]> extends never ? never : K
              ]: RewriteConvertExcludeError<T[K]>;
          }
        : T;

export type CommonTypeExtractContent<T extends CommonType> = {
    sourceKey: string;
} & {
    [K in keyof Omit<T, 'sourceInfo'>]: RewriteCommonTypeExtractContent<Omit<T, 'sourceInfo'>[K]>;
};

export type CommonTypeExtractSourceKey<T extends CommonType> = {
    [K in keyof Omit<T, 'sourceInfo'>]: RewriteCommonTypeExtractSourceKey<Omit<T, 'sourceInfo'>[K]>;
};

export type Convert<T extends CommonType> = {
    objectKey: string;
    sourceKey: string;
} & {
    [K in keyof Omit<T, 'sourceInfo'>]: RewriteConvert<Omit<T, 'sourceInfo'>[K]>;
};

export type ConvertExcludeError<T extends CommonType> = T extends ErrorInfo
    ? never
    : {
          objectKey: string;
          sourceKey: string;
      } & {
          [
              K in keyof Omit<T, 'sourceInfo'> as RewriteConvertExcludeError<
                  Omit<T, 'sourceInfo'>[K]
              > extends never
                  ? never
                  : K
          ]: RewriteConvertExcludeError<Omit<T, 'sourceInfo'>[K]>;
      };

const isCommonType = typia.createIs<CommonType>();

const isCommonTypeExtractContent = typia.createIs<CommonTypeExtractContent<CommonType>>();

const isCommonTypeExtractSourceKey = typia.createIs<CommonTypeExtractSourceKey<CommonType>>();

export const isConvert = <T extends CommonType>(target: unknown): target is Convert<T> => {
    return typia.is<Convert<T>>(target);
};

const isCommonConvert = typia.createIs<Convert<CommonType>>();

const isErrorConvert = typia.createIs<Convert<ErrorInfo>>();

export type SourceJson = {
    objectKey: string;
    context: string;
    source: ({ sourceKey: string } & Omit<SourceInfo, 'context'>)[];
};

export type JsonType = {
    kind: string;
    sourceKeys: Record<string, string[]>;
};

export type GenerateResult<T> = {
    result: T;
    deleteKeys: Record<string, string[]>;
};

export type ErrorJson = JsonType & {
    kind: 'error';
    kindType: string;
};

export const isErrorJson = typia.createIs<ErrorJson>();

export const mergeRecord = (
    target: Record<string, string[]>,
    source: Record<string, string[]>,
): Record<string, string[]> => {
    const _target = { ...target };

    Object.entries(source).forEach(([objectKey, sourceKey]) => {
        const targetObjectRecords = _target[objectKey];
        if (!targetObjectRecords) {
            _target[objectKey] = sourceKey;
        } else {
            targetObjectRecords.push(
                ...sourceKey.filter((item) => !targetObjectRecords.includes(item)),
            );
        }
    });

    return _target;
};

export const makeJsonType = <T extends JsonType>(
    kind: T['kind'],
    record: Record<string, string[]>,
    properties: Omit<T, 'kind' | 'sourceKeys'> = {} as Omit<T, 'kind' | 'sourceKeys'>,
): T => {
    return {
        kind,
        sourceKeys: record,
        ...properties,
    } as T;
};

const makeObjectKey = async (type: string, target: unknown): Promise<string> => {
    const hash = await crypto.webcrypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify(target)),
    );
    const hashHex = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return `${type}_${hashHex}`;
};

const makeSourceKey = async (type: string, target: SourceInfo): Promise<string> => {
    const hash = await crypto.webcrypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify(target)),
    );
    const hashHex = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return `${type}_${hashHex}`;
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

const _extractSourceInfo = async <T>(
    target: unknown,
    sources: ({ sourceKey: string } & SourceInfo)[],
): Promise<RewriteCommonTypeExtractContent<T>> => {
    if (Array.isArray(target)) {
        return (await Promise.all(
            target.map((item) => _extractSourceInfo(item, sources)),
        )) as RewriteCommonTypeExtractContent<T>;
    }

    if (target === null || typeof target !== 'object') {
        return target as RewriteCommonTypeExtractContent<T>;
    }

    if (isCommonType(target)) {
        const { sourceInfo, ...content } = target;
        const sourceKey = await makeSourceKey(content.type, sourceInfo);
        sources.push({ sourceKey: sourceKey, ...sourceInfo });

        const entries = await Promise.all(
            Object.entries(content).map(
                async ([key, child]) => [key, await _extractSourceInfo(child, sources)] as const,
            ),
        );

        return {
            sourceKey,
            ...Object.fromEntries(entries),
        } as RewriteCommonTypeExtractContent<T>;
    }

    const node = target as Record<string, unknown>;

    const entries = await Promise.all(
        Object.entries(node)
            .filter(([, value]) => !isSourceInfo(value))
            .map(async ([key, child]) => [key, await _extractSourceInfo(child, sources)] as const),
    );

    return Object.fromEntries(entries) as RewriteCommonTypeExtractContent<T>;
};

const extractSourceInfo = async <T extends CommonType>(
    target: T,
): Promise<{
    result: CommonTypeExtractContent<T>;
    source: ({ sourceKey: string } & SourceInfo)[];
}> => {
    const sources: ({ sourceKey: string } & SourceInfo)[] = [];

    const result = (await _extractSourceInfo(target, sources)) as CommonTypeExtractContent<T>;

    return {
        result: result,
        source: sources,
    };
};

const _splitSourceKey = <T>(target: unknown): RewriteCommonTypeExtractSourceKey<T> => {
    if (Array.isArray(target)) {
        return target.map((item) => _splitSourceKey(item)) as RewriteCommonTypeExtractSourceKey<T>;
    }

    if (target === null || typeof target !== 'object') {
        return target as RewriteCommonTypeExtractSourceKey<T>;
    }

    if (isCommonTypeExtractContent(target)) {
        const { sourceKey: _, ...content } = target;

        return Object.fromEntries(
            Object.entries(content).map(([key, child]) => [key, _splitSourceKey(child)] as const),
        ) as RewriteCommonTypeExtractSourceKey<T>;
    }

    const node = target as Record<string, unknown>;

    const entries = Object.entries(node)
        .filter(([key, value]) => key !== 'sourceKey')
        .map(([key, child]) => [key, _splitSourceKey(child)] as const);

    return Object.fromEntries(entries) as RewriteCommonTypeExtractSourceKey<T>;
};

const splitSourceKey = <T extends CommonType>(
    target: CommonTypeExtractContent<T>,
): { sourceKey: string; target: Omit<CommonTypeExtractContent<T>, 'sourceKey'> } => {
    const { sourceKey, ...content } = target;

    return {
        sourceKey,
        target: content,
    };
};

const _makeConvertType = async <T>(
    target: unknown,
    sources: ({ sourceKey: string } & SourceInfo)[],
    sourceObjects: SourceJson[],
): Promise<RewriteConvert<T>> => {
    if (Array.isArray(target)) {
        return (await Promise.all(
            target.map((item) => _makeConvertType(item, sources, sourceObjects)),
        )) as RewriteConvert<T>;
    }

    if (target === null || typeof target !== 'object') {
        return target as RewriteConvert<T>;
    }

    if (isCommonTypeExtractContent(target)) {
        const { sourceKey, target: content } = splitSourceKey(target);
        const objectKey = await makeObjectKey(content.type, _splitSourceKey(content));
        const sourceInfoWithKey = sources.find((s) => s.sourceKey === sourceKey)!;
        const { sourceKey: _, ...sourceInfo } = sourceInfoWithKey;
        registerSourceJson(sourceObjects, objectKey, sourceKey, sourceInfo);

        const entries = await Promise.all(
            Object.entries(content).map(
                async ([key, child]) =>
                    [key, await _makeConvertType(child, sources, sourceObjects)] as const,
            ),
        );

        return {
            objectKey: objectKey,
            sourceKey: sourceKey,
            ...Object.fromEntries(entries),
        } as RewriteConvert<T>;
    }

    const node = target as Record<string, unknown>;

    const entries = await Promise.all(
        Object.entries(node).map(
            async ([key, child]) =>
                [key, await _makeConvertType(child, sources, sourceObjects)] as const,
        ),
    );

    return Object.fromEntries(entries) as RewriteConvert<T>;
};

export const makeConvertType = async <T extends CommonType>(
    target: T,
): Promise<{ result: Convert<T>; sourceObjects: SourceJson[] }> => {
    const sourceObjects: SourceJson[] = [];
    const { result, source } = await extractSourceInfo(target);

    const convertResult = (await _makeConvertType(result, source, sourceObjects)) as Convert<T>;

    return { result: convertResult, sourceObjects: sourceObjects };
};

const _collectDeleteKeys = (
    target: unknown,
    records: Record<string, string[]>,
    excludingRecords?: Record<string, string[]>,
): void => {
    if (Array.isArray(target)) {
        target.forEach((item) => _collectDeleteKeys(item, records, excludingRecords));
        return;
    }

    if (target === null || typeof target !== 'object') {
        return;
    }

    if (isCommonConvert(target)) {
        const { objectKey, sourceKey, ...content } = target;

        if (
            !excludingRecords ||
            !Object.keys(excludingRecords).includes(objectKey) ||
            !excludingRecords[objectKey]!.some((item) => item === sourceKey)
        ) {
            if (!Object.keys(records).includes(objectKey)) {
                records[objectKey] = [sourceKey];
            } else {
                records[objectKey]!.push(sourceKey);
            }
        }

        Object.entries(content).forEach((child) => {
            _collectDeleteKeys(child, records, excludingRecords);
        });
    }

    const node = target as Record<string, unknown>;

    Object.entries(node).forEach((child) => {
        _collectDeleteKeys(child, records, excludingRecords);
    });
};

export const collectDelteteKeys = <T extends Convert<CommonType>>(
    target: T,
    excludingDeleteKeys?: Record<string, string[]>,
): Record<string, string[]> => {
    const records: Record<string, string[]> = {};
    _collectDeleteKeys(target, records, excludingDeleteKeys);
    return records;
};

const ERROR = Symbol('ERROR');

const _convertExcludeError = <T>(
    target: unknown,
    errorInfos: Convert<ErrorInfo>[],
): RewriteConvertExcludeError<T> => {
    if (Array.isArray(target)) {
        return target
            .map((item) => _convertExcludeError(item, errorInfos))
            .filter((item) => item !== ERROR) as RewriteConvertExcludeError<T>;
    }

    if (target === null || typeof target !== 'object') {
        return target as RewriteConvertExcludeError<T>;
    }

    if (isErrorConvert(target)) {
        errorInfos.push(target);
        return ERROR as RewriteConvertExcludeError<T>;
    }

    const entries = Object.entries(target as Record<string, unknown>)
        .map(([key, child]) => [key, _convertExcludeError(child, errorInfos)] as const)
        .filter(([_, value]) => value !== ERROR);

    return Object.fromEntries(entries) as RewriteConvertExcludeError<T>;
};

export const convertExcludeError = <T extends CommonType>(
    target: Convert<T>,
): { value: ConvertExcludeError<T> | undefined; errorInfos: Convert<ErrorInfo>[] } => {
    const errorInfos: Convert<ErrorInfo>[] = [];

    const result = _convertExcludeError(target, errorInfos);

    return {
        value: result === ERROR ? undefined : (result as ConvertExcludeError<T>),
        errorInfos: errorInfos,
    };
};

export const removeSourceInfo = (
    sourceObjects: SourceJson[],
    sourceKeys: Record<string, string[]>,
): void => {
    Object.entries(sourceKeys).forEach(([key, value]) => {
        const sourceIndex = sourceObjects.findIndex((object) => object.objectKey === key);

        if (sourceIndex === -1) {
            return;
        }

        const sourceObject = sourceObjects[sourceIndex]!;

        sourceObject.source = sourceObject.source.filter(
            (source) => !value.includes(source.sourceKey),
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
