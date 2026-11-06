import { LwcParser, isLwcSaveId } from '../parser/Lwc/parser';
import { BatchResult, BatchWorker, WorkerOptions } from './batchWorker';
import { SaveSummary } from './workerTask';

export type LwcWorkerOptions = WorkerOptions;

/**
 * LWC のバンドル (lwc/<名前>/ のフォルダ) の解析・保存・読み込みをまとめるクラス。
 * 1 バンドル = 1 件 = 1 つの保存ファイル (<outDir>/lwc_<名前>.msgpack)。バンドルの中のファイル (JS / HTML / CSS /
 * js-meta.xml) はフォルダごとにまとめて読む (LwcParser.parseLwcBundle)。使い方は ObjectWorker と同じ
 */
export class LwcWorker extends BatchWorker<'Lwc'> {
    constructor(options: LwcWorkerOptions) {
        super('Lwc', options);
    }

    /** rootDir 配下 (lwc フォルダ、またはその上) のバンドルをすべて解析して保存する */
    async parseAndSaveAll(rootDir: string): Promise<BatchResult<string, SaveSummary>[]> {
        const directories = await LwcParser.searchBundleDirectories(rootDir);
        return this.batch(directories, (directory) => this.parseAndSave(directory));
    }

    /** LWC の保存名 (lwc_) だけを読む (ほかの種類と同じ保存先でもよい) */
    protected override acceptsSavedId(id: string): boolean {
        return isLwcSaveId(id);
    }
}
