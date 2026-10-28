import { createHash } from 'node:crypto';

import typia from 'typia';

import { SourceInfo, ErrorType, CommonType, isCommonType } from './converter';

// sourceInfo を外し objectKey / sourceKey を付けた形。union は分配されるため type で絞り込める
type ConvertNode<T> =
    T extends CommonType<string>
        ? { objectKey: string; sourceKey: string } & {
              [K in Exclude<keyof T, 'sourceInfo'>]: ConvertNode<T[K]>;
          }
        : T extends readonly (infer U)[]
          ? ConvertNode<U>[]
          : T extends object
            ? { [K in keyof T]: ConvertNode<T[K]> }
            : T;

export type Convert<T extends CommonType<string>> = ConvertNode<T>;

export const isConvert = typia.createIs<Convert<CommonType<string>>>();

export const isSpicifyConvert = <TName extends string>(
    target: unknown,
    types: readonly TName[],
): target is Convert<CommonType<TName>> => {
    return isConvert(target) && types.includes(target.type as TName);
};

const hash = (value: unknown): string => {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
};

type SourceRegistration = { objectKey: string; sourceKey: string; sourceInfo: SourceInfo };

/**
 * 1パスで変換する。戻り値は [変換後ノード, objectKey 計算用の内容]。
 * 子の objectKey 計算用の内容を親に返すことで、部分木を再走査せずに済む。
 * objectKey 計算用の内容は sourceInfo / sourceKey / objectKey を含まない。
 */
const convertNode = (
    target: unknown,
    registrations: (SourceRegistration | null)[],
): [unknown, unknown] => {
    if (Array.isArray(target)) {
        const pairs = target.map((item) => convertNode(item, registrations));
        return [pairs.map(([converted]) => converted), pairs.map(([, keyBody]) => keyBody)];
    }

    if (!isRecord(target)) {
        return [target, target];
    }

    // 親を子より先に登録する（前順）ため、子の処理前に登録位置を確保する
    const isCommon = isCommonType(target);
    const index = registrations.length;
    if (isCommon) {
        registrations.push(null);
    }

    const { sourceInfo: _sourceInfo, ...content } = target;
    const converted: Record<string, unknown> = {};
    const keyBody: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(content)) {
        [converted[key], keyBody[key]] = convertNode(child, registrations);
    }

    if (!isCommon) {
        return [converted, keyBody];
    }

    const sourceKey = `${target.type}_${hash(target.sourceInfo)}`;
    const objectKey = `${target.type}_${hash(keyBody)}`;
    registrations[index] = { objectKey, sourceKey, sourceInfo: target.sourceInfo };

    return [{ objectKey, sourceKey, ...converted }, keyBody];
};

// 処理は同期だが、呼び出し側の await を残すため公開シグネチャは async のまま維持する
export const makeConvertType = async <T extends CommonType<string>>(
    target: T,
): Promise<{ result: Convert<T>; sourceObjects: SourceJson[] }> => {
    const registrations: (SourceRegistration | null)[] = [];
    const [result] = convertNode(target, registrations);

    return { result: result as Convert<T>, sourceObjects: makeSourceObjects(registrations) };
};

// 値が ErrorType のみのプロパティは never として残る（実行時はキーごと消える）
type ExcludeErrorNode<T> = T extends ErrorType
    ? never
    : T extends CommonType<string>
      ? { objectKey: string; sourceKey: string } & {
            [K in Exclude<keyof T, 'sourceInfo'>]: ExcludeErrorNode<T[K]>;
        }
      : T extends readonly (infer U)[]
        ? ExcludeErrorNode<U>[]
        : T extends object
          ? { [K in keyof T]: ExcludeErrorNode<T[K]> }
          : T;

export type ConvertExcludeError<T extends CommonType<string>> = ExcludeErrorNode<T>;

const isConvertExcludeError = typia.createIs<ConvertExcludeError<CommonType<string>>>();

export const isSpicifyConvertExcludeError = <TName extends string>(
    target: unknown,
    types: readonly TName[],
): target is ConvertExcludeError<CommonType<TName>> => {
    return isConvertExcludeError(target) && types.includes(target.type as TName);
};

const ERROR = Symbol('ERROR');

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const isErrorConvert = (value: unknown): value is Convert<ErrorType> => {
    return isRecord(value) && value.type === 'error';
};

const _convertExcludeError = (target: unknown, errorInfos: Convert<ErrorType>[]): unknown => {
    if (Array.isArray(target)) {
        return target
            .map((item) => _convertExcludeError(item, errorInfos))
            .filter((item) => item !== ERROR);
    }

    if (!isRecord(target)) {
        return target;
    }

    if (isErrorConvert(target)) {
        errorInfos.push(target);
        return ERROR;
    }

    const entries = Object.entries(target)
        .map(([key, child]) => [key, _convertExcludeError(child, errorInfos)] as const)
        .filter(([_, value]) => value !== ERROR);

    return Object.fromEntries(entries);
};

export const convertExcludeError = <T extends CommonType<string>>(
    target: Convert<T>,
): { value: ConvertExcludeError<T> | undefined; errorInfos: Convert<ErrorType>[] } => {
    const errorInfos: Convert<ErrorType>[] = [];

    const result = _convertExcludeError(target, errorInfos);

    return {
        value: result === ERROR ? undefined : (result as ConvertExcludeError<T>),
        errorInfos: errorInfos,
    };
};

export type ConvertType<T extends CommonType<string>> =
    Convert<T | ErrorType> | ConvertExcludeError<T>;

type ConvertKeys = { objectKey: string; sourceKey: string };

export const convertValue = <TName extends string, TCommonType extends CommonType<TName>, TResult>(
    types: readonly TName[],
    target: ConvertType<TCommonType> & ConvertKeys,
    errorKind: string,
    process: (
        target: ConvertExcludeError<TCommonType>,
        targetRecords: Record<string, string[]>,
    ) => TResult,
    targetRecords?: Record<string, string[]>,
): TResult | ErrorJson => {
    const record: Record<string, string[]> = targetRecords ?? {
        [target.objectKey]: [target.sourceKey],
    };

    const errorJson: ErrorJson = makeJsonType('error', record, {
        kindType: errorKind,
    });

    // 型ガードで target を絞り込むと巨大な交差型の計算で StructureJsonType の解決が壊れるため、判定のみに使う
    if (isSpicifyConvertExcludeError(target as unknown, types)) {
        return process(target as ConvertExcludeError<TCommonType>, record);
    }

    const { value, errorInfos } = convertExcludeError(target as Convert<TCommonType>);
    if (!value || errorInfos.length > 0) {
        return errorJson;
    }

    // value は !value で絞り込まれ `ExcludeErrorNode<T> & {}` になり、そのまま渡すと同様に型解決が壊れるため明示する
    return process(value as ConvertExcludeError<TCommonType>, record);
};

export type SourceJson = {
    objectKey: string;
    context: string;
    source: ({ sourceKey: string } & Omit<SourceInfo, 'context'>)[];
};

const makeSourceObjects = (registrations: (SourceRegistration | null)[]): SourceJson[] => {
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

export type JsonType<TKind extends string> = {
    kind: TKind;
    sourceKeys: Record<string, string[]>;
};

export const isJsonType = typia.createIs<JsonType<string>>();

export const isSpecificJsonType = <T extends string>(
    target: unknown,
    types: readonly T[],
): target is JsonType<T> => {
    return isJsonType(target) && types.includes(target.kind as T);
};

export type ErrorJson = JsonType<'error'> & {
    kind: 'error';
    kindType: string;
};

export const isErrorJson = typia.createIs<JsonType<'error'>>();

export const makeJsonType = <Tkind extends string, T extends JsonType<Tkind>>(
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

export const mergeRecord = (
    target: Record<string, string[]>,
    sourceKeys: Record<string, string[]>,
): Record<string, string[]> => {
    const result = Object.fromEntries(
        Object.entries(target).map(([key, values]) => [key, [...values]]),
    );

    for (const [objectKey, sourceKey] of Object.entries(sourceKeys)) {
        const targetRecords = result[objectKey];

        if (!targetRecords) {
            result[objectKey] = [...new Set(sourceKey)];
        } else {
            const existing = new Set(targetRecords);

            for (const key of sourceKey) {
                if (!existing.has(key)) {
                    targetRecords.push(key);
                    existing.add(key);
                }
            }
        }
    }

    return result;
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

    if (isJsonType(target)) {
        Object.assign(allKeys, mergeRecord(allKeys, target.sourceKeys));

        for (const [key, value] of Object.entries(target)) {
            if (key !== 'kind' && key !== 'sourceKeys') {
                _gatherSourceKeys(value, allKeys);
            }
        }

        return;
    }

    for (const value of Object.values(target)) {
        _gatherSourceKeys(value, allKeys);
    }
};

const gatherSourceKeys = (target: JsonType<string>) => {
    let allKeys: Record<string, string[]> = {};
    _gatherSourceKeys(target, allKeys);
    return allKeys;
};

export const regenerateSourceObjects = (
    sourceObjects: SourceJson[],
    jsonType: JsonType<string>,
): SourceJson[] => {
    const excludeSourceKeys: Record<string, string[]> = gatherSourceKeys(jsonType);

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
