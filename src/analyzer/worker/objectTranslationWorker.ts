import {
    ObjectTranslationParser,
    isObjectTranslationSaveId,
} from '../parser/Metadata/objectTranslation';
import { BatchResult, BatchWorker, WorkerOptions } from './batchWorker';
import { SaveSummary } from './workerTask';

export type ObjectTranslationWorkerOptions = WorkerOptions;

/**
 * オブジェクトの翻訳 (objectTranslations/<オブジェクト>-<言語>/ のフォルダ) の解析・保存・読み込みをまとめるクラス。
 * 保存は本番用の msgpack (<outDir>/objectTranslation_<オブジェクト>-<言語>.msgpack)。使い方は ObjectWorker と同じ
 */
export class ObjectTranslationWorker extends BatchWorker<'ObjectTranslation'> {
    constructor(options: ObjectTranslationWorkerOptions) {
        super('ObjectTranslation', options);
    }

    /** rootDir 配下 (objectTranslations フォルダ、またはその上) の翻訳をすべて解析して保存する */
    async parseAndSaveAll(rootDir: string): Promise<BatchResult<string, SaveSummary>[]> {
        const directories =
            await ObjectTranslationParser.searchObjectTranslationDirectories(rootDir);
        return this.batch(directories, (directory) => this.parseAndSave(directory));
    }

    /** 翻訳の保存名 (objectTranslation_) だけを読む (ほかの種類と同じ保存先でもよい) */
    protected override acceptsSavedId(id: string): boolean {
        return isObjectTranslationSaveId(id);
    }
}
