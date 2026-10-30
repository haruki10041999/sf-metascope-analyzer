import typia from 'typia';

import { CommonType, isCommonType } from '../converter';

import { SourceJson, SourceRegistration, makeSourceObjects } from './source';
import { hash, isRecord } from './utils';

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

export const isSpecifyConvert = <TName extends string>(
    target: unknown,
    types: readonly TName[],
): target is Convert<CommonType<TName>> => {
    return isConvert(target) && types.includes(target.type as TName);
};

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

    return {
        result: result as Convert<T>,
        sourceObjects: makeSourceObjects(registrations),
    };
};

