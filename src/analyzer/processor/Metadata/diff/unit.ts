import type { XmlResolvedError } from '../../../parser/commons';
import type { ObjectParseResult } from '../../../parser/Metadata/parser';
import type { ObjectTranslationParseResult } from '../../../parser/Metadata/objectTranslation';

import { IdParseResult, IdUnitDiff, makeIdUnitDiffs } from '../../commons/diff/unit';
import { CustomObjectJsonDiff, makeCustomObjectDiff } from './object';
import {
    CustomObjectTranslationJsonDiff,
    makeCustomObjectTranslationDiff,
} from './objectTranslation';

// 解析の単位 (フォルダ) ごとの差分は processor/commons/diff/unit.ts (LWC のバンドルと共通)

/** XML のメタデータ (オブジェクト・翻訳) の解析結果の共通の形 */
type XmlParseResult = IdParseResult & { resolvedError: XmlResolvedError[] };

/** 解析の単位 (オブジェクトのフォルダ・翻訳のフォルダ) 1 つの差分。id (API 名・<オブジェクト>-<言語>) で対応付ける */
export type XmlUnitDiff<R extends XmlParseResult, Content> = IdUnitDiff<R, Content>;

export type ObjectUnitDiff = XmlUnitDiff<ObjectParseResult, CustomObjectJsonDiff>;
export type ObjectTranslationUnitDiff = XmlUnitDiff<
    ObjectTranslationParseResult,
    CustomObjectTranslationJsonDiff
>;

/** 解析結果の一覧同士の差分。id の順に並べる (processor/commons/diff/unit.ts の makeIdUnitDiffs) */
export const makeXmlUnitDiffs = makeIdUnitDiffs;

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
