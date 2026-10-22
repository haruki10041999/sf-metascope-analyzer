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

export const convertFromCommonType = async <T>(
    target: unknown,
    sourceObject: SourceJson[],
): Promise<RewriteConvert<T>> => {
    if (Array.isArray(target)) {
        return (await Promise.all(
            target.map((item) => convertFromCommonType(item, sourceObject)),
        )) as RewriteConvert<T>;
    }

    if (target === null || typeof target !== 'object') {
        return target as RewriteConvert<T>;
    }

    if (isCommonType(target)) {
        const { objectKey, sourceKey } = await makeHashKeys(target);
        const { sourceInfo, ...content } = target;

        registerSourceJson(sourceObject, objectKey, sourceKey, sourceInfo);

        return {
            objectKey,
            sourceKey,
            ...content,
        } as RewriteConvert<T>;
    }

    const node = target as Record<string, unknown>;

    const entries = await Promise.all(
        Object.entries(node)
            .filter(([, value]) => !isSourceInfo(value))
            .map(
                async ([key, child]) =>
                    [key, await convertFromCommonType(child, sourceObject)] as const,
            ),
    );

    return Object.fromEntries(entries) as RewriteConvert<T>;
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
        const objectKey = target.objectKey;
        const sourceKey = target.sourceKey;

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

const _convertExcludeError = (target: unknown, errorInfos: Convert<ErrorInfo>[]): unknown => {
    if (Array.isArray(target)) {
        return target
            .map((item) => _convertExcludeError(item, errorInfos))
            .filter((item) => item !== ERROR);
    }

    if (target === null || typeof target !== 'object') {
        return target;
    }

    if (isErrorConvert(target)) {
        errorInfos.push(target);
        return ERROR;
    }

    const entries = Object.entries(target as Record<string, unknown>)
        .map(([key, child]) => [key, _convertExcludeError(child, errorInfos)] as const)
        .filter(([_, value]) => value !== ERROR);

    return Object.fromEntries(entries);
};

export const convertExcludeError = <T extends CommonType>(
    target: Convert<T>,
): { value: RewriteConvertExcludeError<T> | undefined; errorInfos: Convert<ErrorInfo>[] } => {
    const errorInfos: Convert<ErrorInfo>[] = [];

    const result = _convertExcludeError(target, errorInfos);

    return {
        value: result === ERROR ? undefined : (result as RewriteConvertExcludeError<T>),
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
