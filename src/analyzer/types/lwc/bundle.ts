// バンドル (lwc/<名前>/ のフォルダ) の JSON (docs/lwc-parse-plan.md 2.4)。
// いまは JS / TS のモジュールだけ。templates / stylesheets / meta は 3.3〜3.5 で足す
import type { SourceJson } from '../apex/commons';
import type { ErrorJson } from '../commons/json';

import type { LwcModuleJson } from './module';

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
    skippedFiles: LwcSkippedFileJson[];
};
