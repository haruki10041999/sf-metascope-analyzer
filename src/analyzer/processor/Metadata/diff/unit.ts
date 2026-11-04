import type { ErrorJson } from '../../../types';
import type { XmlResolvedError } from '../../../parser/commons';
import type { ObjectParseResult } from '../../../parser/Metadata/parser';
import type { ObjectTranslationParseResult } from '../../../parser/Metadata/objectTranslation';

import {
    ErrorJsonDiff,
    Pair,
    Sources,
    makeErrorJsonDiff,
    pairAsSet,
} from '../../commons/diff/commons';
import { TypedListDiff, makeTypedListDiff } from '../../commons/diff/list';
import { hasChange } from '../../commons/diff/change';
import { CustomObjectJsonDiff, makeCustomObjectDiff } from './object';
import {
    CustomObjectTranslationJsonDiff,
    makeCustomObjectTranslationDiff,
} from './objectTranslation';

/** XML のメタデータ (オブジェクト・翻訳) の解析結果の共通の形 */
type XmlParseResult = {
    filePath: string;
    resolvedError: XmlResolvedError[];
    dataType: string;
    result: { id: string; base: { kind: string }; sourceObject: Sources['before'] };
};

/**
 * 解析の単位 (オブジェクトのフォルダ・翻訳のフォルダ) 1 つの差分。id (API 名・<オブジェクト>-<言語>) で対応付ける
 * (Apex の UnitDiff はファイルのパス)。中身は、どちらも読めたら Content、どちらも読めなかったら ErrorJson 同士の差分
 */
export type XmlUnitDiff<R extends XmlParseResult, Content> = {
    id: string;
    status: 'added' | 'removed' | 'changed' | 'unchanged';
    /** フォルダのパス。同じなら単体、違えば { before, after } */
    filePath: Pair<string> | { before: string } | { after: string };
    dataType: Pair<R['dataType']> | { before: R['dataType'] } | { after: R['dataType'] };
    /** 読めなかったファイル。B. 集合 (objectKey で対応付ける) */
    resolvedError: TypedListDiff<XmlResolvedError, never>;
    content?: Content | ErrorJsonDiff;
};

export type ObjectUnitDiff = XmlUnitDiff<ObjectParseResult, CustomObjectJsonDiff>;
export type ObjectTranslationUnitDiff = XmlUnitDiff<
    ObjectTranslationParseResult,
    CustomObjectTranslationJsonDiff
>;

const pair = <T>(before: T, after: T): Pair<T> => (before === after ? before : { before, after });

const makeResolvedErrorDiff = (
    before: XmlResolvedError[],
    after: XmlResolvedError[],
): TypedListDiff<XmlResolvedError, never> =>
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
type ContentMaker<R extends XmlParseResult, Content> = {
    dataType: Exclude<R['dataType'], 'error'>;
    make: (before: R['result']['base'], after: R['result']['base'], sources: Sources) => Content;
};

const makeXmlUnitDiff = <R extends XmlParseResult, Content>(
    before: R,
    after: R,
    content: ContentMaker<R, Content>,
): XmlUnitDiff<R, Content> => {
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
        resolvedError,
        ...(diff ? { content: diff } : {}),
    };
};

const makeSingleUnitDiff = <R extends XmlParseResult, Content>(
    status: 'added' | 'removed',
    target: R,
): XmlUnitDiff<R, Content> => {
    const side = status === 'added' ? 'after' : 'before';
    return {
        id: target.result.id,
        status,
        filePath: { [side]: target.filePath } as XmlUnitDiff<R, Content>['filePath'],
        dataType: { [side]: target.dataType } as XmlUnitDiff<R, Content>['dataType'],
        resolvedError: makeResolvedErrorDiff(
            status === 'removed' ? target.resolvedError : [],
            status === 'added' ? target.resolvedError : [],
        ),
    };
};

/** 解析結果の一覧同士の差分。id の順に並べる */
export const makeXmlUnitDiffs = <R extends XmlParseResult, Content>(
    before: R[],
    after: R[],
    content: ContentMaker<R, Content>,
): XmlUnitDiff<R, Content>[] => {
    const afterById = new Map(after.map((target) => [target.result.id, target]));
    const beforeIds = new Set(before.map((target) => target.result.id));

    return [
        ...before.map((b) => {
            const a = afterById.get(b.result.id);
            return a
                ? makeXmlUnitDiff(b, a, content)
                : makeSingleUnitDiff<R, Content>('removed', b);
        }),
        ...after
            .filter((a) => !beforeIds.has(a.result.id))
            .map((a) => makeSingleUnitDiff<R, Content>('added', a)),
    ].sort((x, y) => x.id.localeCompare(y.id));
};

/** オブジェクトの一覧同士の差分。API 名の順に並べる */
export const makeObjectUnitDiffs = (
    before: ObjectParseResult[],
    after: ObjectParseResult[],
): ObjectUnitDiff[] =>
    makeXmlUnitDiffs(before, after, {
        dataType: 'object',
        make: (b, a, sources) =>
            makeCustomObjectDiff(
                b as ObjectParseResult['result']['base'] & { kind: 'object' },
                a as ObjectParseResult['result']['base'] & { kind: 'object' },
                'key',
                sources,
            ),
    });

/** オブジェクトの翻訳の一覧同士の差分。<オブジェクト>-<言語> の順に並べる */
export const makeObjectTranslationUnitDiffs = (
    before: ObjectTranslationParseResult[],
    after: ObjectTranslationParseResult[],
): ObjectTranslationUnitDiff[] =>
    makeXmlUnitDiffs(before, after, {
        dataType: 'objectTranslation',
        make: (b, a, sources) =>
            makeCustomObjectTranslationDiff(
                b as ObjectTranslationParseResult['result']['base'] & { kind: 'objectTranslation' },
                a as ObjectTranslationParseResult['result']['base'] & { kind: 'objectTranslation' },
                'key',
                sources,
            ),
    });
