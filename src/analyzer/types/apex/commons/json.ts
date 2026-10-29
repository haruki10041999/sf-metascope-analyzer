import typia from 'typia';

export type ConvertKeys = { objectKey: string; sourceKey: string };

export type JsonType<TKind extends string> = {
    kind: TKind;
    sourceKeys: ConvertKeys;
};

export const isJsonType = typia.createIs<JsonType<string>>();

export const isSpecificJsonType = <T extends string>(
    target: unknown,
    types: readonly T[],
): target is JsonType<T> => {
    return isJsonType(target) && types.includes(target.kind as T);
};

export type StructureJson<
    TKind extends string,
    TRecord extends Record<string, ConvertKeys | ConvertKeys[]>,
> = {
    kind: TKind;
    sourceKeys: { base: ConvertKeys } & TRecord;
};

export const isStructureJson =
    typia.createIs<StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>>();

export type ErrorJson = JsonType<'error'> & {
    kind: 'error';
    kindType: string;
};

export const isErrorJson = typia.createIs<JsonType<'error'>>();

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

// 境界ノードの範囲外にあるエラーノードを、エラーノード自身のキーで ErrorJson にする
export const makeErrorJson = (target: ConvertKeys, kindType: string): ErrorJson => {
    return makeJsonType(
        'error',
        { objectKey: target.objectKey, sourceKey: target.sourceKey },
        {
            kindType,
        },
    );
};

export const makeStructureJson = <
    const TKind extends string,
    TRecord extends Record<string, ConvertKeys | ConvertKeys[]>,
    TProperties extends object = {},
>(
    kind: TKind,
    sourceKeys: { base: ConvertKeys } & TRecord,
    properties?: TProperties,
): StructureJson<TKind, { base: ConvertKeys } & TRecord> & TProperties => {
    return {
        kind,
        sourceKeys,
        ...properties,
    } as StructureJson<TKind, { base: ConvertKeys } & TRecord> & TProperties;
};
