import { ApexParser } from '../parser/Apex/parser';
import { BatchResult, BatchWorker, WorkerOptions } from './batchWorker';
import { SaveSummary } from './workerTask';

export type ApexWorkerOptions = WorkerOptions;

/**
 * Apex の解析・保存・読み込みをまとめるクラス。保存・読み込みは本番用 (msgpack) に限定する。
 * 1 単位 (クラスはソースと -meta.xml、トリガーも同じ、匿名 Apex は 1 ファイル) = 1 件 = 1 つの保存ファイル
 * (<outDir>/class_<名前>.msgpack など)。開発者用の JSON 出力は、ApexParser.saveApexUnitForDevelopper を直接呼ぶスクリプトで行う。
 * useThreads が true の場合は worker_threads のプールで並列に処理する。
 * スレッドを使った場合は、使い終わったら close() を呼ぶこと。
 */
export class ApexWorker extends BatchWorker<'Apex'> {
    constructor(options: ApexWorkerOptions) {
        super('Apex', options);
    }

    /** srcDir 配下の単位 (フォルダごとにソースと -meta.xml をまとめる) をすべて解析して保存する */
    async parseAndSaveAll(srcDir: string): Promise<BatchResult<string, SaveSummary>[]> {
        const units = await ApexParser.searchApexUnits(srcDir);
        return this.batch(units, (filePath) => this.parseAndSave(filePath));
    }
}
