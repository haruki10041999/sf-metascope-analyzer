import { listSavedIds } from '../parser/commons';
import path from 'path';

import {
    WorkerParseResult,
    WorkerSaveResult,
    WorkerTask,
    WorkerTaskResult,
    WorkerTaskType,
    runWorkerTask,
} from './workerTask';
import { WorkerPool, defaultConcurrency, mapWithConcurrency } from './workerPool';

export type WorkerOptions = {
    /** 保存先のディレクトリ (本番用の msgpack で <outDir>/<id>.msgpack に保存する) */
    outDir: string;
    /** 同時に処理する件数。省略時は CPU 数 - 1 */
    concurrency?: number;
    /**
     * true にすると worker_threads のプールで並列に処理する (既定: false = メインスレッドで処理)。
     * - ttsx 実行時はスレッドごとにプロジェクトの準備が走り 1 スレッドあたり十数秒かかるため使わない。
     * - ビルド版 (npm run build:node → dist/node) では有効。200 ファイルで 4 スレッドが約 3 倍速く、
     *   それ以上はディスク書き込みとスレッドの立ち上げで頭打ちになる。
     * - load はスレッド間の受け渡しの分だけ遅くなるため、読み込み中心ならスレッドは不要。
     */
    useThreads?: boolean;
};

/** 一括処理の結果。1 件の失敗で全体を止めないよう、件ごとに成否を返す */
export type BatchResult<TInput, TResult> =
    { input: TInput; ok: true; result: TResult } | { input: TInput; ok: false; error: Error };

// 実行中のファイルと同じ拡張子 (ttsx 実行時は .ts、ビルド後は .js) のエントリを使う
const threadEntry = new URL(`./workerThread${path.extname(import.meta.url)}`, import.meta.url);

/**
 * 解析・保存・読み込みを、メインスレッドか worker_threads のプールで行う共通部分 (Apex / Object / LWC / フォルダ単位のメタデータで共通)。
 * 保存・読み込みは本番用 (msgpack) に限定する。スレッドを使った場合は、使い終わったら close() を呼ぶこと。
 */
export abstract class BatchWorker<K extends WorkerTaskType> {
    protected readonly outDir: string;
    private readonly concurrency: number;
    private readonly pool: WorkerPool<WorkerTask, unknown> | undefined;

    protected constructor(
        private readonly type: K,
        options: WorkerOptions,
    ) {
        this.outDir = options.outDir;
        this.concurrency = options.concurrency ?? defaultConcurrency();
        this.pool =
            (options.useThreads ?? false)
                ? new WorkerPool<WorkerTask, unknown>(threadEntry, this.concurrency)
                : undefined;
    }

    /**
     * 1 タスク (Apex は単位のどれかのファイル、Object・ObjectTranslation・Lwc・MetadataFolder はフォルダ) を解析して保存する。
     * MetadataFolder はフォルダの中のファイルごとの要約を返す
     */
    parseAndSave(filePath: string): Promise<WorkerSaveResult<K>> {
        return this.run({
            command: 'parseAndSave',
            type: this.type,
            filePath,
            outDir: this.outDir,
        });
    }

    /** 保存済みの解析結果を 1 件読み込む */
    load(id: string): Promise<WorkerParseResult<K>> {
        return this.run({ command: 'load', type: this.type, outDir: this.outDir, id });
    }

    /** outDir 配下の保存済みの解析結果をすべて読み込む */
    async loadAll(): Promise<BatchResult<string, WorkerParseResult<K>>[]> {
        return this.batch(await this.listSavedIds(), (id) => this.load(id));
    }

    /** outDir 配下の保存済みの id (= <id>.msgpack のファイル名から拡張子を除いたもの) */
    async listSavedIds(): Promise<string[]> {
        return listSavedIds(this.outDir, (id) => this.acceptsSavedId(id));
    }

    /** loadAll で読む保存名か (同じ保存先にほかの種類を置くときに絞り込む) */
    protected acceptsSavedId(_id: string): boolean {
        return true;
    }

    async close(): Promise<void> {
        await this.pool?.close();
    }

    protected async run<T extends WorkerTask<K>>(task: T): Promise<WorkerTaskResult<T>> {
        if (this.pool) {
            return (await this.pool.run(task)) as WorkerTaskResult<T>;
        }
        return runWorkerTask(task);
    }

    protected batch<TInput, TResult>(
        inputs: readonly TInput[],
        fn: (input: TInput) => Promise<TResult>,
    ): Promise<BatchResult<TInput, TResult>[]> {
        const settle = (input: TInput): Promise<BatchResult<TInput, TResult>> =>
            fn(input).then(
                (result) => ({ input, ok: true, result }),
                (e: unknown) => ({
                    input,
                    ok: false,
                    error: e instanceof Error ? e : new Error(String(e)),
                }),
            );

        // スレッドの場合は同時実行数をプールが制御するので、まとめて投入する
        return this.pool
            ? Promise.all(inputs.map(settle))
            : mapWithConcurrency(inputs, this.concurrency, settle);
    }
}
