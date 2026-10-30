import { readdir } from 'node:fs/promises';
import path from 'path';

import { ApexParser, FileStructureType } from '../parser/Apex/parser';
import {
    ApexSaveSummary,
    ApexTask,
    ApexTaskResult,
    runApexTask,
    savedApexFileExtension,
} from './apexTask';
import { WorkerPool, defaultConcurrency, mapWithConcurrency } from './workerPool';

export type ApexWorkerOptions = {
    /** 保存先のディレクトリ (本番用の ApexParser.saveApexFile で <outDir>/<id>.msgpack に保存する) */
    outDir: string;
    /** 同時に処理するファイル数。省略時は CPU 数 - 1 */
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

/** 一括処理の結果。1 件の失敗で全体を止めないよう、ファイルごとに成否を返す */
export type BatchResult<TInput, TResult> =
    { input: TInput; ok: true; result: TResult } | { input: TInput; ok: false; error: Error };

// 実行中のファイルと同じ拡張子 (ttsx 実行時は .ts、ビルド後は .js) のエントリを使う
const threadEntry = new URL(`./apexThread${path.extname(import.meta.url)}`, import.meta.url);

/**
 * Apex の解析・保存・読み込みをまとめるクラス。保存・読み込みは本番用 (msgpack) に限定する。
 * 開発者用の JSON 出力は、ApexParser.saveApexFileForDevelopper を直接呼ぶスクリプトで行う。
 * useThreads が true の場合は worker_threads のプールで並列に処理する。
 * スレッドを使った場合は、使い終わったら close() を呼ぶこと。
 */
export class ApexWorker {
    private readonly outDir: string;
    private readonly concurrency: number;
    private readonly pool: WorkerPool<ApexTask, unknown> | undefined;

    constructor(options: ApexWorkerOptions) {
        this.outDir = options.outDir;
        this.concurrency = options.concurrency ?? defaultConcurrency();
        this.pool =
            (options.useThreads ?? false)
                ? new WorkerPool<ApexTask, unknown>(threadEntry, this.concurrency)
                : undefined;
    }

    /** 1 ファイルを解析して保存する */
    parseAndSave(filePath: string): Promise<ApexSaveSummary> {
        return this.run({ type: 'parseAndSave', filePath, outDir: this.outDir });
    }

    /** srcDir 配下の .cls / .trigger / .apex をすべて解析して保存する */
    async parseAndSaveAll(srcDir: string): Promise<BatchResult<string, ApexSaveSummary>[]> {
        const files = await ApexParser.searchApexFiles(srcDir);
        return this.batch(files, (filePath) => this.parseAndSave(filePath));
    }

    /** 保存済みのユニットを 1 件読み込む */
    load(id: string): Promise<FileStructureType> {
        return this.run({ type: 'load', outDir: this.outDir, id });
    }

    /** outDir 配下の保存済みユニットをすべて読み込む */
    async loadAll(): Promise<BatchResult<string, FileStructureType>[]> {
        return this.batch(await this.listSavedIds(), (id) => this.load(id));
    }

    /** outDir 配下の保存済みユニットの id (= <id>.msgpack のファイル名から拡張子を除いたもの) */
    async listSavedIds(): Promise<string[]> {
        const entries = await readdir(this.outDir, { withFileTypes: true }).catch(() => []);
        return entries
            .filter((entry) => entry.isFile() && entry.name.endsWith(savedApexFileExtension))
            .map((entry) => entry.name.slice(0, -savedApexFileExtension.length))
            .sort();
    }

    async close(): Promise<void> {
        await this.pool?.close();
    }

    private async run<T extends ApexTask>(task: T): Promise<ApexTaskResult<T>> {
        if (this.pool) {
            return (await this.pool.run(task)) as ApexTaskResult<T>;
        }
        return runApexTask(task);
    }

    private batch<TInput, TResult>(
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
