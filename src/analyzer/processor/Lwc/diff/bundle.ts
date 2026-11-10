import type { LwcBundleParseResult } from '../../../parser/Lwc/parser';
import type {
    LwcBundleJson,
    LwcBundleMetaJson,
    LwcBundleModuleJson,
    LwcBundleStylesheetJson,
    LwcBundleTemplateJson,
    LwcModuleJson,
    LwcSkippedFileJson,
    LwcStylesheetJson,
    LwcTemplateJson,
} from '../../../types';

import {
    Sources,
    ValueDiff,
    getValueKey,
    makeValueDiff,
    pairByKey,
} from '../../commons/diff/commons';
import {
    TypedListDiff,
    TypedObjectDiff,
    makeTypedListDiff,
    makeTypedObjectDiff,
} from '../../commons/diff/list';
import {
    PresentDiff,
    makePresentDiff,
    makeUnorderedValuesDiff,
    presentEntry,
} from '../../commons/diff/present';
import { IdUnitDiff, makeIdUnitDiffs } from '../../commons/diff/unit';
import { LwcBundleMetaJsonDiff, makeLwcBundleMetaDiff } from './meta';
import { LwcModuleJsonDiff, makeLwcModuleDiff } from './module';
import { LwcStylesheetJsonDiff, makeLwcStylesheetDiff } from './stylesheet';
import { LwcTemplateJsonDiff, makeLwcTemplateDiff } from './template';

// LWC のバンドル (フォルダ) の差分。方針: docs/lwc-implementation.md
// バンドルの対応付け (id = バンドル名) はメタデータのフォルダと同じ processor/commons/diff/unit.ts

/**
 * 読めなかったら null になるファイルの中身 (モジュール・テンプレート・CSS・js-meta.xml)。
 * どちらも読めたら中身の差分、どちらかが読めなければ値ごと (読めなかった理由は resolvedError の差分に出る)
 */
export type LwcFileContentDiff<T, D> = D | ValueDiff<T | null>;

const makeFileContentDiff = <T, D>(
    before: T | null,
    after: T | null,
    makeDiff: (before: T, after: T) => D,
): LwcFileContentDiff<T, D> =>
    before !== null && after !== null
        ? makeDiff(before, after)
        : makeValueDiff<T | null>(before, after);

export type LwcBundleModuleContentDiff = LwcFileContentDiff<LwcModuleJson, LwcModuleJsonDiff>;

export type LwcBundleModuleDiff = TypedObjectDiff<
    LwcBundleModuleJson,
    {
        fileName: ValueDiff<string>;
        main: ValueDiff<boolean>;
        module: LwcBundleModuleContentDiff;
    }
>;

export type LwcBundleTemplateDiff = TypedObjectDiff<
    LwcBundleTemplateJson,
    {
        fileName: ValueDiff<string>;
        main: ValueDiff<boolean>;
        template: LwcFileContentDiff<LwcTemplateJson, LwcTemplateJsonDiff>;
    }
>;

export type LwcBundleStylesheetDiff = TypedObjectDiff<
    LwcBundleStylesheetJson,
    {
        fileName: ValueDiff<string>;
        scoped: ValueDiff<boolean>;
        stylesheet: LwcFileContentDiff<LwcStylesheetJson, LwcStylesheetJsonDiff>;
    }
>;

/** バンドルの中のファイルの配列 (modules / templates / stylesheets) は、ファイル名で対応付ける (D) */
const makeFilesDiff = <F extends { fileName: string }, D>(
    before: F[],
    after: F[],
    makeDiff: (before: F, after: F) => D,
): TypedListDiff<F, D> =>
    makeTypedListDiff(
        before,
        after,
        pairByKey(
            before.map((f) => f.fileName),
            after.map((f) => f.fileName),
            before.map(getValueKey),
            after.map(getValueKey),
        ),
        makeDiff,
    );

export type LwcBundleJsonDiff = TypedObjectDiff<
    LwcBundleJson,
    {
        name: ValueDiff<string>;
        namespace: ValueDiff<string>;
        /** D. キー対応 (ファイル名) */
        modules: TypedListDiff<LwcBundleModuleJson, LwcBundleModuleDiff>;
        /** D. キー対応 (ファイル名) */
        templates: TypedListDiff<LwcBundleTemplateJson, LwcBundleTemplateDiff>;
        /** D. キー対応 (ファイル名) */
        stylesheets: TypedListDiff<LwcBundleStylesheetJson, LwcBundleStylesheetDiff>;
        /** A. スロット (js-meta.xml。どちらにもなければ持たない) */
        meta?: PresentDiff<
            LwcBundleMetaJson | null,
            LwcFileContentDiff<LwcBundleMetaJson, LwcBundleMetaJsonDiff>
        >;
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
        modules: makeFilesDiff(b.modules, a.modules, (x, y) =>
            makeTypedObjectDiff(x, y, (bm, am) => ({
                fileName: makeValueDiff(bm.fileName, am.fileName),
                main: makeValueDiff(bm.main, am.main),
                module: makeFileContentDiff(bm.module, am.module, (x, y) =>
                    makeLwcModuleDiff(x, y, sources),
                ),
            })),
        ),
        // ルートの <template> がないテンプレート・構文エラーで読めなかった CSS は null。makeFileContentDiff が値ごとの比較にする。
        // HTML・CSS を読む前に保存した解析結果は templates / stylesheets を持たないので、空とみなす
        templates: makeFilesDiff(b.templates ?? [], a.templates ?? [], (x, y) =>
            makeTypedObjectDiff(x, y, (bt, at) => ({
                fileName: makeValueDiff(bt.fileName, at.fileName),
                main: makeValueDiff(bt.main, at.main),
                template: makeFileContentDiff(bt.template, at.template, (x, y) =>
                    makeLwcTemplateDiff(x, y, sources),
                ),
            })),
        ),
        stylesheets: makeFilesDiff(b.stylesheets ?? [], a.stylesheets ?? [], (x, y) =>
            makeTypedObjectDiff(x, y, (bs, as) => ({
                fileName: makeValueDiff(bs.fileName, as.fileName),
                scoped: makeValueDiff(bs.scoped, as.scoped),
                stylesheet: makeFileContentDiff(bs.stylesheet, as.stylesheet, (x, y) =>
                    makeLwcStylesheetDiff(x, y, sources),
                ),
            })),
        ),
        ...presentEntry(
            'meta',
            makePresentDiff(b.meta, a.meta, (x, y) =>
                makeFileContentDiff(x, y, (bm, am) => makeLwcBundleMetaDiff(bm, am, sources)),
            ),
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
