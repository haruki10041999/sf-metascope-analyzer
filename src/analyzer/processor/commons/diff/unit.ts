import type { ConvertKeys, ErrorJson } from '../../../types';

import { ErrorJsonDiff, Pair, Sources, makeErrorJsonDiff, pairAsSet } from './commons';
import { TypedListDiff, makeTypedListDiff } from './list';
import { hasChange } from './change';

// 解析の単位 (フォルダ・バンドル) ごとの差分。id で対応付ける。
// メタデータ (オブジェクト・翻訳) と LWC (バンドル) で共通 (Apex はファイルのパスで対応付ける processor/Apex/diff/unit.ts)

/** 解析結果の共通の形 (ObjectParseResult / ObjectTranslationParseResult / LwcBundleParseResult) */
export type IdParseResult = {
    filePath: string;
    resolvedError: { sourceKeys: ConvertKeys }[];
    dataType: string;
    result: { id: string; base: unknown; sourceObject: Sources['before'] };
};

/**
 * 解析の単位 1 つの差分。id で対応付ける。
 * 中身は、どちらも読めたら Content、どちらも読めなかったら ErrorJson 同士の差分
 */
export type IdUnitDiff<R extends IdParseResult, Content> = {
    id: string;
    status: 'added' | 'removed' | 'changed' | 'unchanged';
    /** フォルダのパス。同じなら単体、違えば { before, after } */
    filePath: Pair<string> | { before: string } | { after: string };
    dataType: Pair<R['dataType']> | { before: R['dataType'] } | { after: R['dataType'] };
    /** 診断・読めなかったファイル。B. 集合 (objectKey で対応付ける) */
    resolvedError: TypedListDiff<R['resolvedError'][number], never>;
    content?: Content | ErrorJsonDiff;
};

const pair = <T>(before: T, after: T): Pair<T> => (before === after ? before : { before, after });

const makeResolvedErrorDiff = <E extends { sourceKeys: ConvertKeys }>(
    before: E[],
    after: E[],
): TypedListDiff<E, never> =>
    makeTypedListDiff(
        before,
        after,
        pairAsSet(
            before.map((e) => e.sourceKeys.objectKey),
            after.map((e) => e.sourceKeys.objectKey),
        ),
        () => undefined as never,
    );

/** 読めた結果の dataType (それ以外は 'error') と、中身の差分の作り方 */
export type ContentMaker<R extends IdParseResult, Content> = {
    dataType: Exclude<R['dataType'], 'error'>;
    make: (before: R['result']['base'], after: R['result']['base'], sources: Sources) => Content;
};

const makeIdUnitDiff = <R extends IdParseResult, Content>(
    before: R,
    after: R,
    content: ContentMaker<R, Content>,
): IdUnitDiff<R, Content> => {
    const sources = { before: before.result.sourceObject, after: after.result.sourceObject };
    const diff =
        before.dataType === content.dataType && after.dataType === content.dataType
            ? content.make(before.result.base, after.result.base, sources)
            : before.dataType === 'error' && after.dataType === 'error'
              ? makeErrorJsonDiff(before.result.base as ErrorJson, after.result.base as ErrorJson)
              : undefined;
    const resolvedError = makeResolvedErrorDiff(before.resolvedError, after.resolvedError);
    const changed =
        before.dataType !== after.dataType || hasChange(diff) || hasChange(resolvedError);

    return {
        id: after.result.id,
        status: changed ? 'changed' : 'unchanged',
        filePath: pair(before.filePath, after.filePath),
        dataType: pair<R['dataType']>(before.dataType, after.dataType),
        resolvedError: resolvedError as IdUnitDiff<R, Content>['resolvedError'],
        ...(diff ? { content: diff } : {}),
    };
};

const makeSingleUnitDiff = <R extends IdParseResult, Content>(
    status: 'added' | 'removed',
    target: R,
): IdUnitDiff<R, Content> => {
    const side = status === 'added' ? 'after' : 'before';
    return {
        id: target.result.id,
        status,
        filePath: { [side]: target.filePath } as IdUnitDiff<R, Content>['filePath'],
        dataType: { [side]: target.dataType } as IdUnitDiff<R, Content>['dataType'],
        resolvedError: makeResolvedErrorDiff(
            status === 'removed' ? target.resolvedError : [],
            status === 'added' ? target.resolvedError : [],
        ) as IdUnitDiff<R, Content>['resolvedError'],
    };
};

/** 解析結果の一覧同士の差分。id の順に並べる */
export const makeIdUnitDiffs = <R extends IdParseResult, Content>(
    before: R[],
    after: R[],
    content: ContentMaker<R, Content>,
): IdUnitDiff<R, Content>[] => {
    const afterById = new Map(after.map((target) => [target.result.id, target]));
    const beforeIds = new Set(before.map((target) => target.result.id));

    return [
        ...before.map((b) => {
            const a = afterById.get(b.result.id);
            return a ? makeIdUnitDiff(b, a, content) : makeSingleUnitDiff<R, Content>('removed', b);
        }),
        ...after
            .filter((a) => !beforeIds.has(a.result.id))
            .map((a) => makeSingleUnitDiff<R, Content>('added', a)),
    ].sort((x, y) => x.id.localeCompare(y.id));
};
