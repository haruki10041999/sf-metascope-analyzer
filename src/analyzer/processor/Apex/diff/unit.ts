import type {
    ApexMetaFileJson,
    ApexSourceJson,
    ApexUnitJson,
    ApexUnitParseResult,
} from '../../../parser/Apex';

import { Sources, ValueDiff, makeValueDiff } from '../../commons/diff/commons';
import { TypedObjectDiff, makeTypedObjectDiff } from '../../commons/diff/list';
import { PresentDiff, makePresentDiff, presentEntry } from '../../commons/diff/present';
import { IdUnitDiff, makeIdUnitDiffs } from '../../commons/diff/unit';
import { UnitContentDiff, makeUnitContentDiff } from './unitBody';

// Apex の単位 (クラス・トリガー・匿名 Apex) の差分。LWC のバンドル・オブジェクトと同じく、id (class_<名前> など) で
// 対応付ける (processor/commons/diff/unit.ts)。中身はソースと -meta.xml に分けて比べる

/** 読めたソース (読めなかったもの (fileType: 'error') は中身を持たない) */
type ReadSourceJson = Exclude<ApexSourceJson, { fileType: 'error' }>;

/**
 * ソースの差分。どちらも読めて種類 (cls / trigger / anonymous) が同じなら中身の差分 (makeUnitContentDiff)、
 * そうでなければ (読めなかった・種類が変わった) 値ごと (読めなかった理由は resolvedError の差分に出る)
 */
export type ApexSourceDiff =
    | TypedObjectDiff<
          ReadSourceJson,
          {
              fileName: ValueDiff<string>;
              fileType: ValueDiff<ReadSourceJson['fileType']>;
              content: UnitContentDiff;
          }
      >
    | ValueDiff<ApexSourceJson>;

const makeSourceDiff = (
    before: ApexSourceJson,
    after: ApexSourceJson,
    sources: Sources,
): ApexSourceDiff => {
    if (
        before.fileType === 'error' ||
        after.fileType === 'error' ||
        before.fileType !== after.fileType
    ) {
        return makeValueDiff(before, after);
    }
    const fileType = before.fileType;
    return makeTypedObjectDiff(before, after, (b, a) => ({
        fileName: makeValueDiff(b.fileName, a.fileName),
        fileType: makeValueDiff(b.fileType, a.fileType),
        content: makeUnitContentDiff(
            fileType,
            { base: b.content, sourceObject: sources.before },
            { base: a.content, sourceObject: sources.after },
        )!,
    }));
};

/**
 * -meta.xml の差分。どちらも読めて種類が同じなら中身の差分、そうでなければ値ごと
 * (読めなかった -meta.xml の meta は null。理由は resolvedError の差分に出る)
 */
export type ApexMetaFileDiff = TypedObjectDiff<
    ApexMetaFileJson,
    {
        fileName: ValueDiff<string>;
        meta: UnitContentDiff | ValueDiff<ApexMetaFileJson['meta']>;
    }
>;

const makeMetaFileDiff = (before: ApexMetaFileJson, after: ApexMetaFileJson): ApexMetaFileDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        fileName: makeValueDiff(b.fileName, a.fileName),
        meta:
            b.meta && a.meta && b.meta.kind === a.meta.kind
                ? makeUnitContentDiff(b.meta.kind, { base: b.meta }, { base: a.meta })!
                : makeValueDiff(b.meta, a.meta),
    }));

export type ApexUnitJsonDiff = TypedObjectDiff<
    ApexUnitJson,
    {
        name: ValueDiff<string>;
        unitType: ValueDiff<ApexUnitJson['unitType']>;
        /** 片方にしかなければ added / removed (ソースだけ・-meta.xml だけの単位もある) */
        source?: PresentDiff<ApexSourceJson, ApexSourceDiff>;
        meta?: PresentDiff<ApexMetaFileJson, ApexMetaFileDiff>;
    }
>;

export const makeApexUnitJsonDiff = (
    before: ApexUnitJson,
    after: ApexUnitJson,
    sources: Sources,
): ApexUnitJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        unitType: makeValueDiff(b.unitType, a.unitType),
        ...presentEntry(
            'source',
            makePresentDiff(b.source, a.source, (x, y) => makeSourceDiff(x, y, sources)),
        ),
        ...presentEntry('meta', makePresentDiff(b.meta, a.meta, makeMetaFileDiff)),
    }));

/** 単位 1 つの差分。id (class_<名前> / trigger_<名前> / anonymous_<名前>) で対応付ける */
export type ApexUnitDiff = IdUnitDiff<ApexUnitParseResult, ApexUnitJsonDiff>;

/** 単位の解析結果の一覧同士の差分。LWC の makeLwcBundleDiffs・メタデータの makeXmlUnitDiffs と同じ makeIdUnitDiffs を使う */
export const makeApexUnitDiffs = (
    before: ApexUnitParseResult[],
    after: ApexUnitParseResult[],
): ApexUnitDiff[] =>
    makeIdUnitDiffs<ApexUnitParseResult, ApexUnitJsonDiff>(before, after, {
        dataType: 'apexUnit',
        make: (b, a, sources) =>
            makeApexUnitJsonDiff(b as ApexUnitJson, a as ApexUnitJson, sources),
    });
