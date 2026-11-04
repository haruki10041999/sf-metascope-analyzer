import { ApexParser } from '../parser/Apex/parser';
import { BatchResult, BatchWorker, WorkerOptions } from './batchWorker';
import { SaveSummary } from './workerTask';

export type ApexWorkerOptions = WorkerOptions;

/**
 * Apex の解析・保存・読み込みをまとめるクラス。保存・読み込みは本番用 (msgpack) に限定する。
 * 開発者用の JSON 出力は、ApexParser.saveApexFileForDevelopper を直接呼ぶスクリプトで行う。
 * useThreads が true の場合は worker_threads のプールで並列に処理する。
 * スレッドを使った場合は、使い終わったら close() を呼ぶこと。
 */
export class ApexWorker extends BatchWorker<'Apex'> {
    constructor(options: ApexWorkerOptions) {
        super('Apex', options);
    }

    /** srcDir 配下の .cls / .trigger / .apex と、クラス・トリガーのメタデータ (-meta.xml) をすべて解析して保存する */
    async parseAndSaveAll(srcDir: string): Promise<BatchResult<string, SaveSummary>[]> {
        const files = await ApexParser.searchApexFiles(srcDir);
        return this.batch(files, (filePath) => this.parseAndSave(filePath));
    }
}
