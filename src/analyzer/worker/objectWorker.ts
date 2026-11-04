import { MetadataParser } from '../parser/Metadata/parser';
import { BatchResult, BatchWorker, WorkerOptions } from './batchWorker';
import { SaveSummary } from './workerTask';

export type ObjectWorkerOptions = WorkerOptions;

/**
 * オブジェクト (objects/<API 名>/ のフォルダ) の解析・保存・読み込みをまとめるクラス。
 * 保存は本番用の msgpack (<outDir>/<API 名>.msgpack)。使い方は ApexWorker と同じ
 */
export class ObjectWorker extends BatchWorker<'Object'> {
    constructor(options: ObjectWorkerOptions) {
        super('Object', options);
    }

    /** rootDir 配下 (objects フォルダ、またはその上) のオブジェクトをすべて解析して保存する */
    async parseAndSaveAll(rootDir: string): Promise<BatchResult<string, SaveSummary>[]> {
        const directories = await MetadataParser.searchObjectDirectories(rootDir);
        return this.batch(directories, (directory) => this.parseAndSave(directory));
    }
}
