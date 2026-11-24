import { hash } from 'node:crypto';

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

/**
 * JSON の中身から objectKey の元の文字列を作る (IR の objectKey と同じ考え方)。
 * キーを並べ替え、位置 (sourceKeys) は除き、子のノード (kind と sourceKeys を持つ) は子の objectKey に置きかえる
 */
const jsonKeyBody = (value: unknown): string | undefined => {
    switch (typeof value) {
        case 'string':
        case 'number':
        case 'boolean':
            return JSON.stringify(value);
        case 'undefined':
        case 'function':
        case 'symbol':
        case 'bigint':
            return undefined;
    }
    if (value === null) return 'null';
    if (Array.isArray(value))
        return `[${value.map((item) => jsonKeyBody(item) ?? 'null').join(',')}]`;
    const record = value as Record<string, unknown>;
    const keys = record.sourceKeys as { objectKey?: unknown } | undefined;
    if (typeof record.kind === 'string' && typeof keys?.objectKey === 'string') {
        return JSON.stringify(keys.objectKey);
    }
    const parts: string[] = [];
    for (const key of Object.keys(record).sort()) {
        if (key === 'sourceKeys') continue;
        const child = jsonKeyBody(record[key]);
        if (child !== undefined) parts.push(`${JSON.stringify(key)}:${child}`);
    }
    return `{${parts.join(',')}}`;
};

/**
 * 中身からキーを作る JsonType (位置を借りるノード・ファイルの入れ物・単位の根など、ソースに対応するノードがないもの)。
 * objectKey はこのノード自身の中身 (`<kind>_<hash>`。子のノードは子の objectKey)、sourceKey は位置を借りる先のもの
 * (docs/plan.md 4.2)
 */
export const makeContentKeyedJson = <T extends JsonType<string>>(
    kind: T['kind'],
    sourceKey: string,
    properties: DistributiveOmit<T, 'kind' | 'sourceKeys'> = {} as DistributiveOmit<
        T,
        'kind' | 'sourceKeys'
    >,
): T => {
    const objectKey = `${kind}_${hash('sha256', jsonKeyBody(properties) ?? '', 'hex').slice(0, 16)}`;
    return makeJsonType<string, T>(kind, { objectKey, sourceKey }, properties);
};

/**
 * T が JsonType (kind と sourceKeys を持つノード) であることを、型の上で確かめる (docs/plan.md 4.2)。
 * test/converter/json-type-assertions.ts が、公開しているすべての JSON の型をこれに通す
 */
export type AssertJsonType<T extends JsonType<string>> = T;
