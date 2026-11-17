import path from 'node:path';

import { locateUnits, parseUnitFromTree } from '../unit/repository';
import { WorkingTree } from '../unit/sourceTree';
import { type AnyUnitType, type UnitParseResult, UNIT_TYPES, findUnitType } from '../unit/unitType';

import {
    WorkerPool,
    defaultConcurrency,
    mapWithConcurrency,
    registerWorkerTask,
} from './workerPool';

export type WorkerOptions = {
    /** 同時に処理する件数。省略時は CPU 数 - 1 */
    concurrency?: number;
    /**
     * true にすると worker_threads のプールで並列に処理する (既定: false = メインスレッドで処理)。
     * - ttsx 実行時はスレッドごとにプロジェクトの準備が走り 1 スレッドあたり十数秒かかるため使わない。
     * - ビルド版 (npm run build:node → dist/node) では有効。
     */
    useThreads?: boolean;
};

/** 一括処理の結果。1 件の失敗で全体を止めないよう、件ごとに成否を返す */
export type BatchResult<TInput, TResult> =
    { input: TInput; ok: true; result: TResult } | { input: TInput; ok: false; error: Error };

// すべての単位の種類を 1 つで扱う worker。タスクは「単位の種類 + 単位の場所」の解析。
// 保存は UnitStore (SQLite) が行う。方針: docs/analysis-plan.md 2 章、docs/implementation-roadmap.md 5 章

/** スレッドとインラインの両方で実行するタスク (worker_threads で受け渡すため plain object) */
export type UnitTask = { command: 'parse'; unitType: string; root: string; location: string };

const unitTypeOf = (type: string): AnyUnitType => {
    const unitType = findUnitType(type);
    if (!unitType) throw new Error(`Unknown unit type: ${type}`);
    return unitType;
};

/** 1 タスクを実行する (スレッドでもメインスレッドでも同じ) */
export const runUnitTask = (task: UnitTask): Promise<UnitParseResult> =>
    parseUnitFromTree(new WorkingTree(task.root), unitTypeOf(task.unitType), task.location);

/** worker_threads のエントリ (unitWorkerThread.ts) が呼ぶ */
export const registerUnitWorkerThread = () =>
    registerWorkerTask((task: UnitTask) => runUnitTask(task));

// 実行中のファイルと同じ拡張子 (ttsx 実行時は .ts、ビルド後は .js) のエントリを使う
const threadEntry = new URL(`./unitWorkerThread${path.extname(import.meta.url)}`, import.meta.url);

/**
 * すべての単位の種類の解析を、メインスレッドか worker_threads のプールで行う。
 * スレッドを使った場合は、使い終わったら close() を呼ぶこと
 */
export class UnitWorker {
    private readonly concurrency: number;
    private readonly pool: WorkerPool<UnitTask, unknown> | undefined;

    constructor(options: WorkerOptions) {
        this.concurrency = options.concurrency ?? defaultConcurrency();
        this.pool =
            (options.useThreads ?? false)
                ? new WorkerPool<UnitTask, unknown>(threadEntry, this.concurrency)
                : undefined;
    }

    /** root の下のすべての単位 (types の種類) を解析する。結果は単位ごと */
    async parseAll(
        root: string,
        types: readonly AnyUnitType[] = UNIT_TYPES,
    ): Promise<BatchResult<{ unitType: string; location: string }, UnitParseResult>[]> {
        const located = locateUnits(await new WorkingTree(root).listFiles(), types);
        const inputs = [...located].flatMap(([unitType, locations]) =>
            locations.map((location) => ({ unitType, location })),
        );
        return this.batch(inputs, ({ unitType, location }) => this.parse(unitType, root, location));
    }

    /** 単位 1 つを解析する */
    parse(unitType: string, root: string, location: string): Promise<UnitParseResult> {
        return this.run({ command: 'parse', unitType, root, location });
    }

    async close(): Promise<void> {
        await this.pool?.close();
    }

    private async run(task: UnitTask): Promise<UnitParseResult> {
        if (this.pool) return (await this.pool.run(task)) as UnitParseResult;
        return runUnitTask(task);
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
        return this.pool
            ? Promise.all(inputs.map(settle))
            : mapWithConcurrency(inputs, this.concurrency, settle);
    }
}
