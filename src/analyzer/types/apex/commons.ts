import { createHash } from 'node:crypto';

import typia from 'typia';

import { SourceInfo, ErrorType, CommonType } from './converter';

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

export const isConvertOf = <T extends { type: string }, TName extends T['type']>(
    target: T,
    name: TName,
): target is Extract<T, { type: TName }> => {
    return target.type === name;
};

export type SourceJson = {
    objectKey: string;
    context: string;
    source: ({ sourceKey: string } & Omit<SourceInfo, 'context'>)[];
};

export type JsonType<TKind extends string> = {
    kind: TKind;
    sourceKeys: Record<string, string[]>;
};

export type StructureJsonType<TKind extends string> = {
    kind: TKind;
    sourceKeys: { [key: string]: Record<string, string[]> | Record<string, string[]>[] };
    [key: string]:
        | TKind
        | Omit<JsonType<string>, 'sourceKeys'>
        | Omit<JsonType<string>, 'sourceKeys'>[]
        | { [key: string]: Record<string, string[]> | Record<string, string[]>[] };
};

export const isStructureJsonType = typia.createIs<StructureJsonType<string>>();

export type ErrorJson = JsonType<'error'> & {
    kind: 'error';
    kindType: string;
};

export const isErrorJson = typia.createIs<JsonType<'error'>>();

const _mergeRecord = (
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

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isRecordStringArray = (value: unknown): value is Record<string, string[]> => {
    return (
        isRecord(value) &&
        Object.values(value).every(
            (v) => Array.isArray(v) && v.every((item) => typeof item === 'string'),
        )
    );
};

const isRecordRecordStringArray = (value: unknown): value is Record<string, string[]>[] => {
    return Array.isArray(value) && value.every((v) => isRecordStringArray(v));
};

export const mergeRecord = (
    target: Record<string, string[]>,
    sourceKeys: Record<string, string[]> | Record<string, string[]>[],
): Record<string, string[]> => {
    let source: Record<string, string[]> = {};
    if (isRecordStringArray(sourceKeys)) {
        source = { ...sourceKeys };
    } else if (isRecordRecordStringArray(sourceKeys)) {
        sourceKeys.forEach((record) => {
            source = _mergeRecord(source, record);
        });
    }

    return _mergeRecord(target, source);
};

export const makeJsonType = <TName extends string, T extends JsonType<TName>>(
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

const hash = (value: unknown): string => {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
};

const isCommonNode = (value: unknown): value is CommonType<string> => {
    return isRecord(value) && typeof value.type === 'string' && 'sourceInfo' in value;
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
    const isCommon = isCommonNode(target);
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

// 処理は同期だが、呼び出し側の await を残すため公開シグネチャは async のまま維持する
export const makeConvertType = async <T extends CommonType<string>>(
    target: T,
): Promise<{ result: Convert<T>; sourceObjects: SourceJson[] }> => {
    const registrations: (SourceRegistration | null)[] = [];
    const [result] = convertNode(target, registrations);

    return { result: result as Convert<T>, sourceObjects: makeSourceObjects(registrations) };
};

const ERROR = Symbol('ERROR');

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

export const regenerateSourceObjects = (
    sourceObjects: SourceJson[],
    excludeSourceKeys: Record<string, string[]>,
): SourceJson[] => {
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
