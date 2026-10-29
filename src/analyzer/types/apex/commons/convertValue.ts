import { CommonType } from '../converter';

import { Convert } from './convert';
import { ConvertExcludeError, ConvertType, convertExcludeError } from './excludeError';
import { ConvertKeys, ErrorJson, makeJsonType } from './json';
import { isRecord } from './utils';

export type StructureSourceKeys<TRecord extends Record<string, ConvertKeys | ConvertKeys[]>> = {
    base: ConvertKeys;
} & TRecord;

export type ConvertValueOptions<TKey extends string = string> = {
    /**
     * エラー検査の対象から外すプロパティ。外したプロパティは子の変換関数がエラーを処理する。
     * 'children' はノード自身だけを検査する（子はすべて対象外）。
     */
    exclude?: readonly string[] | 'children';
    /** StructureJson の sourceKeys に集める子ノード。{ JSON 側の名前: 変換元のプロパティ名 } */
    record?: Readonly<Record<TKey, string>>;
};

const toKeys = (target: unknown): ConvertKeys | ConvertKeys[] | null => {
    if (Array.isArray(target)) {
        return target.flatMap((item) => {
            const keys = toKeys(item);
            return keys === null ? [] : keys;
        });
    }
    if (
        isRecord(target) &&
        typeof target.objectKey === 'string' &&
        typeof target.sourceKey === 'string'
    ) {
        return { objectKey: target.objectKey, sourceKey: target.sourceKey };
    }
    return null;
};

const makeStructureSourceKeys = <TRecord extends Record<string, ConvertKeys | ConvertKeys[]>>(
    target: ConvertKeys & Record<string, unknown>,
    record: Readonly<Record<string, string>>,
): StructureSourceKeys<TRecord> => {
    const sourceKeys: Record<string, ConvertKeys | ConvertKeys[]> = {
        base: { objectKey: target.objectKey, sourceKey: target.sourceKey },
    };
    for (const [name, property] of Object.entries(record)) {
        const keys = toKeys(target[property]);
        if (keys !== null) {
            sourceKeys[name] = keys;
        }
    }
    return sourceKeys as StructureSourceKeys<TRecord>;
};

// エラー検査の対象になる部分だけを残す
const pickCheckTarget = (
    target: Record<string, unknown>,
    exclude: ConvertValueOptions['exclude'],
): Record<string, unknown> => {
    if (!exclude) {
        return target;
    }
    return Object.fromEntries(
        Object.entries(target).filter(([key, value]) =>
            exclude === 'children'
                ? value === null || typeof value !== 'object'
                : !exclude.includes(key),
        ),
    );
};

/**
 * 境界ノードを変換する。検査範囲（既定は部分木全体）にエラーノードがあれば ErrorJson を返す。
 * process には検査を通った target がそのまま渡る（exclude したプロパティにはエラーが残りうる）。
 */
export const convertValue = <
    TName extends string,
    TCommonType extends CommonType<TName>,
    TResult,
    TRecord extends Record<string, ConvertKeys | ConvertKeys[]> = Record<
        string,
        ConvertKeys | ConvertKeys[]
    >,
>(
    target: ConvertType<TCommonType> & ConvertKeys,
    kind: string,
    process: (
        target: ConvertExcludeError<TCommonType>,
        targetRecords: StructureSourceKeys<TRecord>,
    ) => TResult,
    options: ConvertValueOptions = {},
): TResult | ErrorJson => {
    const node = target as unknown as ConvertKeys & Record<string, unknown>;
    const record = makeStructureSourceKeys<TRecord>(node, options.record ?? {});

    const { errorInfos } = convertExcludeError(
        pickCheckTarget(node, options.exclude) as Convert<TCommonType>,
    );
    if (node.type === 'error' || errorInfos.length > 0) {
        return makeJsonType('error', record.base, {
            kindType: kind,
        });
    }

    return process(target as ConvertExcludeError<TCommonType>, record);
};
