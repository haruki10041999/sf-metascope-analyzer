import typia from 'typia';

import { CommonType, ErrorType } from '../converter';

import { Convert } from './convert';
import { isRecord } from './utils';

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

export type ConvertType<T extends CommonType<string>> =
    Convert<T | ErrorType> | ConvertExcludeError<T>;

// ノード自身はエラーでないが、子にエラーノードを含みうる。境界ノードの範囲外を処理する関数が受け取る
export type ConvertWithError<T extends CommonType<string>> = Convert<T> | ConvertExcludeError<T>;

export const isErrorNode = <T extends { type: string }>(
    target: T,
): target is Extract<T, { type: 'error' }> => {
    return target.type === 'error';
};

const isConvertExcludeError = typia.createIs<ConvertExcludeError<CommonType<string>>>();

export const isSpecifyConvertExcludeError = <TName extends string>(
    target: unknown,
    types: readonly TName[],
): target is ConvertExcludeError<CommonType<TName>> => {
    return isConvertExcludeError(target) && types.includes(target.type as TName);
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
