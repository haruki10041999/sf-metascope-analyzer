export type ConvertKeys = {
    objectKey: string;
    sourceKey: string;
};

export type JsonType<TKind extends string> = {
    kind: TKind;
    sourceKeys: ConvertKeys;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isConvertKeys = (value: unknown): value is ConvertKeys =>
    isRecord(value) && typeof value.objectKey === 'string' && typeof value.sourceKey === 'string';

/** JsonType か (kind が文字列で、sourceKeys が objectKey・sourceKey を持つ) */
export const isJsonType = (target: unknown): target is JsonType<string> =>
    isRecord(target) && typeof target.kind === 'string' && isConvertKeys(target.sourceKeys);

export const isSpecificJsonType = <T extends string>(
    target: unknown,
    types: readonly T[],
): target is JsonType<T> => {
    return isJsonType(target) && types.includes(target.kind as T);
};

export type StructureJsonType<
    TKind extends string,
    TRecord extends Record<string, ConvertKeys | ConvertKeys[]>,
> = {
    kind: TKind;
    sourceKeys: { base: ConvertKeys } & TRecord;
};

/** StructureJsonType か (sourceKeys が base と、名前ごとの ConvertKeys・その並びを持つ) */
export const isStructureJsonType = (
    target: unknown,
): target is StructureJsonType<string, Record<string, ConvertKeys | ConvertKeys[]>> =>
    isRecord(target) &&
    typeof target.kind === 'string' &&
    isRecord(target.sourceKeys) &&
    isConvertKeys(target.sourceKeys.base) &&
    Object.values(target.sourceKeys).every(
        (keys) => isConvertKeys(keys) || (Array.isArray(keys) && keys.every(isConvertKeys)),
    );

// union の各要素ごとに Omit する（通常の Omit は union の共通キーしか残さない）
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export const makeJsonType = <Tkind extends string, T extends JsonType<Tkind>>(
    kind: T['kind'],
    record: ConvertKeys,
    properties: DistributiveOmit<T, 'kind' | 'sourceKeys'> = {} as DistributiveOmit<
        T,
        'kind' | 'sourceKeys'
    >,
): T => {
    return {
        kind,
        sourceKeys: record,
        ...properties,
    } as unknown as T;
};

export const makeStructureJson = <
    const TKind extends string,
    TRecord extends Record<string, ConvertKeys | ConvertKeys[]>,
    TProperties extends object = {},
>(
    kind: TKind,
    sourceKeys: { base: ConvertKeys } & TRecord,
    properties?: TProperties,
): StructureJsonType<TKind, { base: ConvertKeys } & TRecord> & TProperties => {
    return {
        kind,
        sourceKeys,
        ...properties,
    } as StructureJsonType<TKind, { base: ConvertKeys } & TRecord> & TProperties;
};
