import {
    ConvertKeys,
    ErrorJson,
    JsonType,
    SourceInfo,
    SourceJson,
    StructureJson,
    isJsonType,
    isStructureJson,
    makeJsonType,
} from '../../types';

export type ExtractConvertNode<T> = T extends readonly (infer U)[]
    ? ExtractConvertNode<U>[]
    : T extends
            JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>
      ? T extends { kind: infer Kind extends string }
          ? {
                [K in Kind]: ConvertKeys;
            } & ExtractConvertNodeProperties<T>
          : never
      : T extends object
        ? ExtractConvertNodeProperties<T>
        : never;

type ExtractConvertNodeProperties<T> = {
    [
        K in keyof T as K extends 'kind' | 'sourceKeys'
            ? never
            : [ExtractConvertNode<T[K]>] extends [never]
              ? never
              : K
    ]: ExtractConvertNode<T[K]>;
};

export type ExtractConvert<
    T extends JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>,
> = ExtractConvertNode<T>;

const makeConvertKeys = (
    target: JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>,
): ConvertKeys => {
    if (isJsonType(target)) {
        return target.sourceKeys;
    }

    return target.sourceKeys.base;
};

const _extractConvertKeys = (target: unknown): unknown => {
    if (Array.isArray(target)) {
        const extracted = target
            .map((value) => _extractConvertKeys(value))
            .filter((value) => value !== undefined);

        return extracted.length > 0 ? extracted : undefined;
    }

    if (target === null || typeof target !== 'object') {
        return undefined;
    }

    if (isJsonType(target) || isStructureJson(target)) {
        const { kind } = target;

        const children = Object.fromEntries(
            Object.entries(target)
                .filter(([key]) => key !== 'kind' && key !== 'sourceKeys')
                .map(([key, value]) => [key, _extractConvertKeys(value)])
                .filter(([, value]) => value !== undefined),
        );

        return {
            [kind]: makeConvertKeys(target),
            ...children,
        };
    }

    const extracted = Object.fromEntries(
        Object.entries(target)
            .map(([key, value]) => [key, _extractConvertKeys(value)])
            .filter(([, value]) => value !== undefined),
    );

    return Object.keys(extracted).length > 0 ? extracted : undefined;
};

export const extractConvert = <
    T extends JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>,
>(
    target: unknown,
): ExtractConvert<T> => {
    return _extractConvertKeys(target) as ExtractConvert<T>;
};

export const matchdJsonIndexes = <
    T extends JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>,
>(
    target: T[],
    objectKey: string,
): { index: number; data: T }[] => {
    const indexes: { index: number; data: T }[] = [];
    target.forEach((t, index) => {
        if (t.sourceKeys.objectKey === objectKey) {
            indexes.push({
                index: index,
                data: t,
            });
        }
    });

    return indexes;
};

const _findConvertKeys = (target: unknown, property: Set<string>, result: ConvertKeys[]): void => {
    if (Array.isArray(target)) {
        target.forEach((t) => _findConvertKeys(t, property, result));
    }

    if (target === null || typeof target !== 'object') {
        return;
    }

    Object.entries(target).forEach(([key, value]) => {
        if (property.has(key)) {
            result.push(value as ConvertKeys);
        }
    });
};

export const findConvertKeys = (target: unknown, property: Set<string>): ConvertKeys[] => {
    const result: ConvertKeys[] = [];
    _findConvertKeys(target, property, result);

    return result;
};

export const findSourceInfo = <
    T extends JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>,
>(
    sourceInfo: SourceJson[],
    baseJson: T,
): { sourceKeys: ConvertKeys } & SourceInfo => {
    sourceInfo.forEach((si) => {
        if (si.objectKey === baseJson.sourceKeys.objectKey) {
            const source = si.source;

            source.forEach((s) => {
                if (s.sourceKey === baseJson.sourceKeys.sourceKey) {
                    const { sourceKey, ...rest } = s;
                    return {
                        sourceKeys: { objectKey: si.objectKey, sourceKey: sourceKey },
                        context: si.context,
                        ...rest,
                    };
                }
            });
        }
    });

    throw new Error(
        `target is not found:${JSON.stringify({ kind: baseJson.kind, sourcekeys: baseJson.sourceKeys })}`,
    );
};

const _findJson = <
    T extends JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>,
>(
    target: unknown,
    baseJson: T,
): T | undefined => {
    if (Array.isArray(target)) {
        for (const value of target) {
            const result = _findJson(value, baseJson);

            if (result !== undefined) {
                return result;
            }
        }

        return undefined;
    }

    if (target === null || typeof target !== 'object') {
        return undefined;
    }

    if (isJsonType(target) || isStructureJson(target)) {
        const baseConvertKeys = makeConvertKeys(baseJson);
        const convertKeys = makeConvertKeys(target);

        if (
            (Object.entries(baseConvertKeys) as [keyof ConvertKeys, string][]).every(
                ([key, value]) => convertKeys[key] === value,
            )
        ) {
            return target as T;
        }
    }

    for (const value of Object.values(target)) {
        const result = _findJson(value, baseJson);

        if (result !== undefined) {
            return result;
        }
    }

    return undefined;
};

export const findJson = <
    T extends JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>,
>(
    target: unknown,
    baseJson: T,
): JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>> => {
    const targetJson = _findJson(target, baseJson);

    if (!targetJson) {
        const { kind, sourceKeys } = baseJson;
        throw new Error(
            `target is not found:${JSON.stringify({ kind: kind, sourcekeys: sourceKeys })}`,
        );
    }

    return targetJson;
};

export const findErrorJsons = (
    target: unknown,
    extractConvert: unknown,
    errorKind: Set<string>,
): ErrorJson[] => {
    const convertKeys: ConvertKeys[] = findConvertKeys(extractConvert, new Set<string>('error'));

    return convertKeys
        .map((key) => findJson(target, makeJsonType('error', key, {})) as ErrorJson)
        .filter((e) => errorKind.has(e.kindType));
};

const _matchedObjectJson = <
    T extends JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>,
>(
    target: unknown,
    baseJson: T,
    results: T[],
):
    | JsonType<string>
    | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>
    | undefined => {
    if (Array.isArray(target)) {
        for (const value of target) {
            _matchedObjectJson(value, baseJson, results);
        }
    }

    if (target === null || typeof target !== 'object') {
        return undefined;
    }

    if (isJsonType(target) || isStructureJson(target)) {
        const baseConvertKeys = makeConvertKeys(baseJson);
        const convertKeys = makeConvertKeys(target);

        if (convertKeys.objectKey === baseConvertKeys.objectKey) {
            results.push(target as T);
        }
    }

    for (const value of Object.values(target)) {
        _matchedObjectJson(value, baseJson, results);
    }
};

export const matchedObjectJson = <
    T extends JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>,
>(
    target: unknown,
    baseJson: T,
): T[] => {
    const results: T[] = [];
    _matchedObjectJson(target, baseJson, results);

    return results;
};

export type SourceDistance = {
    start: number;
    end: number;
    range: number;
    center: number;
};

export const getSourceDistance = (
    a: { sourceKeys: ConvertKeys } & SourceInfo,
    b: { sourceKeys: ConvertKeys } & SourceInfo,
): SourceDistance => {
    const start = Math.abs(a.start.offset - b.start.offset);
    const end = Math.abs(a.end.offset - b.end.offset);

    const range =
        a.end.offset < b.start.offset
            ? b.start.offset - a.end.offset
            : b.end.offset < a.start.offset
              ? a.start.offset - b.end.offset
              : 0;

    const center = Math.abs(
        (a.start.offset + a.end.offset) / 2 - (b.start.offset + b.end.offset) / 2,
    );

    return {
        start,
        end,
        range,
        center,
    };
};

