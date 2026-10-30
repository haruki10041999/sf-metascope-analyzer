import { availableParallelism } from 'node:os';
import { Worker, parentPort } from 'node:worker_threads';

type TaskRequest<TTask> = { taskId: number; task: TTask };

type TaskResponse<TResult> =
    | { taskId: number; ok: true; result: TResult }
    | { taskId: number; ok: false; error: { message: string; stack?: string } };

type PendingTask<TTask, TResult> = {
    taskId: number;
    task: TTask;
    resolve: (result: TResult) => void;
    reject: (error: Error) => void;
};

export const defaultConcurrency = () => Math.max(1, availableParallelism() - 1);

/**
 * worker_threads のプール。タスクはキューに積み、空いているスレッドに 1 件ずつ渡す。
 * スレッド側は registerWorkerTask でハンドラを登録したエントリファイルを指定する。
 */
export class WorkerPool<TTask, TResult> {
    private readonly idle: Worker[] = [];
    private readonly running = new Map<Worker, PendingTask<TTask, TResult>>();
    private readonly queue: PendingTask<TTask, TResult>[] = [];
    private workerCount = 0;
    private nextTaskId = 0;
    private closed = false;

    constructor(
        private readonly entry: URL,
        private readonly size: number = defaultConcurrency(),
    ) {}

    run(task: TTask): Promise<TResult> {
        if (this.closed) {
            return Promise.reject(new Error('WorkerPool is closed'));
        }

        return new Promise<TResult>((resolve, reject) => {
            this.queue.push({ taskId: this.nextTaskId++, task, resolve, reject });
            this.dispatch();
        });
    }

    async close(): Promise<void> {
        this.closed = true;
        for (const pending of this.queue.splice(0)) {
            pending.reject(new Error('WorkerPool is closed'));
        }
        const workers = [...this.idle.splice(0), ...this.running.keys()];
        this.workerCount = 0;
        await Promise.all(workers.map((worker) => worker.terminate()));
    }

    private dispatch(): void {
        while (this.queue.length > 0) {
            const worker = this.idle.pop() ?? this.spawn();
            if (!worker) {
                return;
            }

            const pending = this.queue.shift()!;
            this.running.set(worker, pending);
            const request: TaskRequest<TTask> = { taskId: pending.taskId, task: pending.task };
            worker.postMessage(request);
        }
    }

    private spawn(): Worker | undefined {
        if (this.workerCount >= this.size) {
            return undefined;
        }
        this.workerCount++;

        const worker = new Worker(this.entry);

        worker.on('message', (response: TaskResponse<TResult>) => {
            const pending = this.running.get(worker);
            if (!pending || pending.taskId !== response.taskId) {
                return;
            }
            this.running.delete(worker);

            if (response.ok) {
                pending.resolve(response.result);
            } else {
                const error = new Error(response.error.message);
                if (response.error.stack) {
                    error.stack = response.error.stack;
                }
                pending.reject(error);
            }

            if (!this.closed) {
                this.idle.push(worker);
                this.dispatch();
            }
        });

        // スレッドが落ちた場合は実行中のタスクを失敗させ、スレッドを作り直せるようにする
        worker.on('error', (error) => {
            this.running.get(worker)?.reject(error);
            this.discard(worker);
        });
        worker.on('exit', (code) => {
            this.running
                .get(worker)
                ?.reject(new Error(`Worker exited unexpectedly (code: ${code})`));
            this.discard(worker);
        });

        return worker;
    }

    private discard(worker: Worker): void {
        if (!this.running.delete(worker) && !this.idle.includes(worker)) {
            return;
        }
        const idleIndex = this.idle.indexOf(worker);
        if (idleIndex >= 0) {
            this.idle.splice(idleIndex, 1);
        }
        this.workerCount--;
        if (!this.closed) {
            this.dispatch();
        }
    }
}

/** スレッドのエントリファイルで呼び、親から来たタスクを handler で処理して結果を返す */
export const registerWorkerTask = <TTask, TResult>(
    handler: (task: TTask) => Promise<TResult>,
): void => {
    if (!parentPort) {
        throw new Error('registerWorkerTask must be called inside a worker thread');
    }
    const port = parentPort;

    port.on('message', async ({ taskId, task }: TaskRequest<TTask>) => {
        let response: TaskResponse<TResult>;
        try {
            response = { taskId, ok: true, result: await handler(task) };
        } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            response = {
                taskId,
                ok: false,
                error: { message: error.message, ...(error.stack ? { stack: error.stack } : {}) },
            };
        }
        port.postMessage(response);
    });
};

/** スレッドを使わない場合の同時実行数制限つき map (結果は入力順) */
export const mapWithConcurrency = async <T, R>(
    items: readonly T[],
    concurrency: number,
    fn: (item: T) => Promise<R>,
): Promise<R[]> => {
    const results = new Array<R>(items.length);
    let next = 0;
    const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await fn(items[index]!);
        }
    });
    await Promise.all(runners);
    return results;
};
