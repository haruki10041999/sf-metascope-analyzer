// バンドル (lwc/<名前>/ のフォルダ) の JSON (docs/lwc-json-reference.md)。
// JS / TS のモジュール・HTML のテンプレート・CSS・js-meta.xml (meta)
import type { SourceJson } from '../apex/commons';
import type { ErrorJson } from '../commons/json';

import type { LwcBundleMetaJson } from './meta';
import type { LwcModuleJson } from './module';
import type { LwcStylesheetJson } from './stylesheet';
import type { LwcTemplateJson } from './template';

/** ソース位置。Apex の SourceJson に、ファイルのパスを足したもの */
export type LwcSourceJson = Omit<SourceJson, 'source'> & {
    source: (SourceJson['source'][number] & { filePath: string })[];
};

export type LwcBundleModuleJson = {
    /** ファイル名 (hello.ts) */
    fileName: string;
    /** メインのモジュール (<バンドル名>.ts / .js) */
    main: boolean;
    module: LwcModuleJson | ErrorJson;
};

export type LwcBundleTemplateJson = {
    /** ファイル名 (hello.html) */
    fileName: string;
    /** メインのテンプレート (<バンドル名>.html)。ほかは render() で切り替えるテンプレート */
    main: boolean;
    /** ルートの <template> がないときは ErrorJson */
    template: LwcTemplateJson | ErrorJson;
};

export type LwcBundleStylesheetJson = {
    /** ファイル名 (hello.css) */
    fileName: string;
    /** *.scoped.css */
    scoped: boolean;
    /** 構文エラーで読めなかったときは ErrorJson */
    stylesheet: LwcStylesheetJson | ErrorJson;
};

export type LwcSkippedFileJson = {
    /** バンドルのフォルダの親からの相対パス */
    filePath: string;
    reason: string;
};

export type LwcBundleJson = {
    /** バンドル名 (hello) */
    name: string;
    /** 名前空間 (c) */
    namespace: string;
    modules: LwcBundleModuleJson[];
    templates: LwcBundleTemplateJson[];
    stylesheets: LwcBundleStylesheetJson[];
    /** <バンドル名>.js-meta.xml。ファイルがなければ持たない。読めなければ ErrorJson */
    meta?: LwcBundleMetaJson | ErrorJson;
    skippedFiles: LwcSkippedFileJson[];
};
