import { METADATA_FOLDER_PARSERS, findParserBySaveId } from '../parser/Metadata/folders';
import { BatchResult, BatchWorker, WorkerOptions } from './batchWorker';
import { SaveSummary } from './workerTask';

export type MetadataFolderWorkerOptions = WorkerOptions;

/**
 * フォルダ単位のメタデータ (permissionsets/・profiles/ など) の解析・保存・読み込みをまとめるクラス。
 * 1 タスク = 種類のフォルダ 1 つ (中のファイルをまとめて読む)。保存はファイルごと (<outDir>/<種類>_<名前>.msgpack)。
 * 種類はフォルダ名・保存名の接頭辞で決める (parser/Metadata/folders.ts)。方針: docs/metadata-a-plan.md 2.1 章
 */
export class MetadataFolderWorker extends BatchWorker<'MetadataFolder'> {
    constructor(options: MetadataFolderWorkerOptions) {
        super('MetadataFolder', options);
    }

    /** rootDir 配下の、すべての種類のフォルダを解析して保存する。結果はフォルダごと (中はファイルごとの要約) */
    async parseAndSaveAll(rootDir: string): Promise<BatchResult<string, SaveSummary[]>[]> {
        const folders = (
            await Promise.all(
                METADATA_FOLDER_PARSERS.map((parser) => parser.searchFolders(rootDir)),
            )
        )
            .flat()
            .sort();
        return this.batch(folders, (folder) => this.parseAndSave(folder));
    }

    /** フォルダ単位のメタデータの保存名だけを読む (オブジェクトなどと同じ保存先でもよい) */
    protected override acceptsSavedId(id: string): boolean {
        return findParserBySaveId(id) !== undefined;
    }
}
