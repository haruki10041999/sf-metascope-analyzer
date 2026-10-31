import { ConvertKeys, JsonType, StructureJson, isJsonType, isStructureJson } from '../../types';

export type DiffAttribute<T> = {
    before: T;
    after: T;
};

export type DiffAttributeArray<T> = {
    common: T[];
    before: T[];
    after: T[];
};

type ExtractConvertNode<T> = T extends readonly (infer U)[]
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

const _findJson = (
    target: unknown,
    objectKey: string,
    sourceKey: string,
):
    | JsonType<string>
    | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>
    | undefined => {
    if (Array.isArray(target)) {
        for (const value of target) {
            const result = _findJson(value, objectKey, sourceKey);

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
        const convertKeys = makeConvertKeys(target);

        if (convertKeys.objectKey === objectKey && convertKeys.sourceKey === sourceKey) {
            return target;
        }
    }

    for (const value of Object.values(target)) {
        const result = _findJson(value, objectKey, sourceKey);

        if (result !== undefined) {
            return result;
        }
    }

    return undefined;
};

