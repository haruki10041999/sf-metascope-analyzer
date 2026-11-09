import path from 'node:path';

import { listSavedIds, writeSaveDataInfo } from '../parser/commons';
import { Repository, locateUnits, parseUnitFromTree } from '../unit/repository';
import { WorkingTree } from '../unit/sourceTree';
import {
    type AnyUnitType,
    type UnitParseResult,
    UNIT_TYPES,
    findUnitType,
    findUnitTypeBySaveId,
} from '../unit/unitType';

import { WorkerPool, defaultConcurrency, mapWithConcurrency, registerWorkerTask } from './workerPool';

export type WorkerOptions = {
    /** 保存先のディレクトリ (本番用の msgpack で <outDir>/<保存名>.msgpack に保存する) */
    outDir: string;
    /** 同時に処理する件数。省略時は CPU 数 - 1 */
    concurrency?: number;
    /**
     * true にすると worker_threads のプールで並列に処理する (既定: false = メインスレッドで処理)。
     * - ttsx 実行時はスレッドごとにプロジェクトの準備が走り 1 スレッドあたり十数秒かかるため使わない。
     * - ビルド版 (npm run build:node → dist/node) では有効。
     * - 読み込みはスレッド間の受け渡しの分だけ遅くなるため、スレッドは使わない。
     */
    useThreads?: boolean;
};

/** 一括処理の結果。1 件の失敗で全体を止めないよう、件ごとに成否を返す */
export type BatchResult<TInput, TResult> =
    | { input: TInput; ok: true; result: TResult }
    | { input: TInput; ok: false; error: Error };

// すべての単位の種類を 1 つで扱う worker。タスクは「単位の種類 + 単位の場所」。
// 保存先は 1 つのフォルダで、読み込みは保存名の接頭辞で種類を選ぶ。方針: docs/analysis-plan.md 2 章

/** スレッドとインラインの両方で実行するタスク (worker_threads で受け渡すため plain object) */
export type UnitTask =
    | { command: 'parseAndSave'; unitType: string; root: string; location: string; outDir: string }
    | { command: 'parse'; unitType: string; root: string; location: string }
    | { command: 'load'; outDir: string; saveId: string };

/** 保存の要約 */
export type UnitSaveSummary = {
    unitType: string;
    id: string;
    saveId: string;
    filePath: string;
    dataType: string;
    errorCount: number;
};

export type UnitTaskResult<T extends UnitTask> = T extends { command: 'parseAndSave' }
    ? UnitSaveSummary
    : UnitParseResult;

const unitTypeOf = (type: string): AnyUnitType => {
    const unitType = findUnitType(type);
    if (!unitType) throw new Error(`Unknown unit type: ${type}`);
    return unitType;
};

/** 1 タスクを実行する (スレッドでもメインスレッドでも同じ) */
export const runUnitTask = async <T extends UnitTask>(task: T): Promise<UnitTaskResult<T>> => {
    switch (task.command) {
        case 'parse':
        case 'parseAndSave': {
            const unitType = unitTypeOf(task.unitType);
            const parsed = await parseUnitFromTree(
                new WorkingTree(task.root),
                unitType,
                task.location,
            );
            if (task.command === 'parse') return parsed as UnitTaskResult<T>;
            await writeSaveDataInfo(unitType.save(task.outDir, parsed));
            return {
                unitType: unitType.type,
                id: parsed.result.id,
                saveId: unitType.saveIdOf(parsed),
                filePath: parsed.filePath,
                dataType: parsed.dataType,
                errorCount: parsed.resolvedError.length,
            } as UnitTaskResult<T>;
        }
        case 'load': {
            const unitType = findUnitTypeBySaveId(task.saveId);
            if (!unitType) throw new Error(`Unknown saved unit: ${task.saveId}`);
            return (await unitType.load(task.outDir, task.saveId)) as UnitTaskResult<T>;
        }
    }
};

/** worker_threads のエントリ (unitWorkerThread.ts) が呼ぶ */
export const registerUnitWorkerThread = () =>
    registerWorkerTask((task: UnitTask) => runUnitTask(task));

// 実行中のファイルと同じ拡張子 (ttsx 実行時は .ts、ビルド後は .js) のエントリを使う
const threadEntry = new URL(`./unitWorkerThread${path.extname(import.meta.url)}`, import.meta.url);

/**
 * すべての単位の種類の解析・保存・読み込みを、メインスレッドか worker_threads のプールで行う。
 * スレッドを使った場合は、使い終わったら close() を呼ぶこと
 */
export class UnitWorker {
    private readonly outDir: string;
    private readonly concurrency: number;
    private readonly pool: WorkerPool<UnitTask, unknown> | undefined;

    constructor(options: WorkerOptions) {
        this.outDir = options.outDir;
        this.concurrency = options.concurrency ?? defaultConcurrency();
        this.pool =
            (options.useThreads ?? false)
                ? new WorkerPool<UnitTask, unknown>(threadEntry, this.concurrency)
                : undefined;
    }

    /** root の下のすべての単位 (types の種類) を解析して保存する。結果は単位ごと */
    async parseAndSaveAll(
        root: string,
        types: readonly AnyUnitType[] = UNIT_TYPES,
    ): Promise<BatchResult<{ unitType: string; location: string }, UnitSaveSummary>[]> {
        const located = locateUnits(await new WorkingTree(root).listFiles(), types);
        const inputs = [...located].flatMap(([unitType, locations]) =>
            locations.map((location) => ({ unitType, location })),
        );
        return this.batch(inputs, ({ unitType, location }) =>
            this.run({ command: 'parseAndSave', unitType, root, location, outDir: this.outDir }),
        );
    }

    /** 単位 1 つを解析する (保存しない) */
    parse(unitType: string, root: string, location: string): Promise<UnitParseResult> {
        return this.run({ command: 'parse', unitType, root, location });
    }

    /**
     * 保存した単位をすべて読む (種類ごと)。版の違う保存データがあれば空。
     * 読み込みはスレッド間の受け渡しの分だけ遅くなるため、スレッドは使わない
     */
    loadAll(root: string, types: readonly AnyUnitType[] = UNIT_TYPES): Promise<Repository> {
        return Repository.loadSaved(root, this.outDir, types);
    }

    /** 保存した単位の保存名 (types の種類だけ。名前の順) */
    listSavedIds(types: readonly AnyUnitType[] = UNIT_TYPES): Promise<string[]> {
        const names = new Set(types.map((t) => t.type));
        return listSavedIds(this.outDir, (saveId) => {
            const unitType = findUnitTypeBySaveId(saveId);
            return unitType !== undefined && names.has(unitType.type);
        });
    }

    /** 保存した単位を 1 つ読む */
    load(saveId: string): Promise<UnitParseResult> {
        return this.run({ command: 'load', outDir: this.outDir, saveId });
    }

    async close(): Promise<void> {
        await this.pool?.close();
    }

    private async run<T extends UnitTask>(task: T): Promise<UnitTaskResult<T>> {
        if (this.pool) return (await this.pool.run(task)) as UnitTaskResult<T>;
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
