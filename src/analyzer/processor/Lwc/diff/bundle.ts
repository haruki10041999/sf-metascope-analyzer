import type { LwcBundleParseResult } from '../../../parser/Lwc/parser';
import type {
    ErrorJson,
    LwcBundleJson,
    LwcBundleModuleJson,
    LwcModuleJson,
    LwcSkippedFileJson,
} from '../../../types';

import {
    ErrorJsonDiff,
    Sources,
    ValueDiff,
    getValueKey,
    makeErrorJsonDiff,
    makeValueDiff,
    pairByKey,
} from '../../commons/diff/commons';
import {
    TypedListDiff,
    TypedObjectDiff,
    makeTypedListDiff,
    makeTypedObjectDiff,
} from '../../commons/diff/list';
import { makeUnorderedValuesDiff } from '../../commons/diff/present';
import { IdUnitDiff, makeIdUnitDiffs } from '../../commons/diff/unit';
import { LwcModuleJsonDiff, makeLwcModuleDiff } from './module';

// LWC のバンドル (フォルダ) の差分。方針: docs/lwc-diff-policy.md
// バンドルの対応付け (id = バンドル名) はメタデータのフォルダと同じ processor/commons/diff/unit.ts

/** モジュールの中身。どちらも読めたらモジュールの差分、どちらも読めなかったら ErrorJson 同士、片方だけなら値ごと */
export type LwcBundleModuleContentDiff =
    LwcModuleJsonDiff | ErrorJsonDiff | ValueDiff<LwcModuleJson | ErrorJson>;

const makeModuleContentDiff = (
    before: LwcModuleJson | ErrorJson,
    after: LwcModuleJson | ErrorJson,
    sources: Sources,
): LwcBundleModuleContentDiff => {
    const beforeError = 'kind' in before;
    const afterError = 'kind' in after;
    if (!beforeError && !afterError) return makeLwcModuleDiff(before, after, sources);
    if (beforeError && afterError) return makeErrorJsonDiff(before, after);
    return makeValueDiff<LwcModuleJson | ErrorJson>(before, after);
};

export type LwcBundleModuleDiff = TypedObjectDiff<
    LwcBundleModuleJson,
    {
        fileName: ValueDiff<string>;
        main: ValueDiff<boolean>;
        module: LwcBundleModuleContentDiff;
    }
>;

export type LwcBundleJsonDiff = TypedObjectDiff<
    LwcBundleJson,
    {
        name: ValueDiff<string>;
        namespace: ValueDiff<string>;
        /** D. キー対応 (ファイル名) */
        modules: TypedListDiff<LwcBundleModuleJson, LwcBundleModuleDiff>;
        /** B. 集合 */
        skippedFiles: TypedListDiff<LwcSkippedFileJson, never>;
    }
>;

export const makeLwcBundleDiff = (
    before: LwcBundleJson,
    after: LwcBundleJson,
    sources: Sources,
): LwcBundleJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        namespace: makeValueDiff(b.namespace, a.namespace),
        modules: makeTypedListDiff(
            b.modules,
            a.modules,
            pairByKey(
                b.modules.map((m) => m.fileName),
                a.modules.map((m) => m.fileName),
                b.modules.map(getValueKey),
                a.modules.map(getValueKey),
            ),
            (x, y) =>
                makeTypedObjectDiff(x, y, (bm, am) => ({
                    fileName: makeValueDiff(bm.fileName, am.fileName),
                    main: makeValueDiff(bm.main, am.main),
                    module: makeModuleContentDiff(bm.module, am.module, sources),
                })),
        ),
        skippedFiles: makeUnorderedValuesDiff(b.skippedFiles, a.skippedFiles),
    }));

/** バンドル 1 つの差分。バンドル名で対応付ける */
export type LwcBundleUnitDiff = IdUnitDiff<LwcBundleParseResult, LwcBundleJsonDiff>;

/** バンドルの解析結果の一覧同士の差分。メタデータの makeXmlUnitDiffs と同じ makeIdUnitDiffs を使う */
export const makeLwcBundleDiffs = (
    before: LwcBundleParseResult[],
    after: LwcBundleParseResult[],
): LwcBundleUnitDiff[] =>
    makeIdUnitDiffs<LwcBundleParseResult, LwcBundleJsonDiff>(before, after, {
        dataType: 'lwcBundle',
        make: (b, a, sources) => makeLwcBundleDiff(b as LwcBundleJson, a as LwcBundleJson, sources),
    });
