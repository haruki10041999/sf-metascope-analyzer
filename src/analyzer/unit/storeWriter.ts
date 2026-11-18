import path from 'node:path';
import { Worker, parentPort, workerData } from 'node:worker_threads';

import type { UnitSourceFile } from './storeBackend';
import { SqliteStoreBackend } from './storeSqlite';
import type { UnitParseResult } from './unitType';

// 解析結果の DB への書き込みを、別のスレッドで行う (docs/implementation-roadmap.md 8 章の M5)。
// 案 A (1 ノード 1 行) では大きいリポジトリで行の数が多く (NPSP で 170 万行・約 20 秒)、メインのスレッドで書くと
// parse を並列にしても書き込みを待つことになる。書き込みのスレッドは自分の接続を開き、まとめて 1 つのトランザクションで書く。
// メインのスレッドは渡すだけで待たず、読む前 (読み込みの終わり・保存の始め) に flush で書き終わるのを待つ

/** 解析結果を書く先 (UnitStore が使う) */
export interface ParsedWriter {
    /** 書く (待たない。誤りは flush で返す) */
    write(
        type: string,
        key: string,
        formatVersion: string,
        data: UnitParseResult,
        files: readonly UnitSourceFile[],
    ): void;
    /** それまでに渡したものを書き終えて確定する */
    flush(): Promise<void>;
    close(): Promise<void>;
}

type WriteMessage = {
    type: 'write';
    args: [string, string, string, UnitParseResult, readonly UnitSourceFile[]];
};
type FlushMessage = { type: 'flush'; id: number };
type Reply = { id: number; error?: string };

// 実行中のファイルと同じ拡張子 (ttsx では .ts、ビルド後は .js) のエントリを使う
const threadEntry = new URL(`./storeWriterThread${path.extname(import.meta.url)}`, import.meta.url);

/** 書き込みのスレッド (メインのスレッドの側) */
export class StoreWriterThread implements ParsedWriter {
    private readonly worker: Worker;
    private nextId = 0;
    private readonly waiting = new Map<
        number,
        { resolve: () => void; reject: (e: Error) => void }
    >();
    private failure: Error | undefined;

    /** dir は置き場 (<savingRoot>/store)。メインのスレッドの置き場を開いたあとに作ること (版の確かめと表の作り直しはそちら) */
    constructor(dir: string) {
        this.worker = new Worker(threadEntry, { workerData: { dir } });
        this.worker.on('message', (reply: Reply) => {
            const waiter = this.waiting.get(reply.id);
            if (!waiter) return;
            this.waiting.delete(reply.id);
            if (reply.error) waiter.reject(new Error(reply.error));
            else waiter.resolve();
        });
        const fail = (error: Error) => {
            this.failure = error;
            for (const waiter of this.waiting.values()) waiter.reject(error);
            this.waiting.clear();
        };
        this.worker.on('error', fail);
        this.worker.on('exit', (code) => {
            if (code !== 0) fail(new Error(`Store writer exited (code: ${code})`));
        });
    }

    write(...args: WriteMessage['args']): void {
        if (this.failure) return;
        this.worker.postMessage({ type: 'write', args } satisfies WriteMessage);
    }

    flush(): Promise<void> {
        if (this.failure) return Promise.reject(this.failure);
        const id = this.nextId++;
        return new Promise((resolve, reject) => {
            this.waiting.set(id, { resolve, reject });
            this.worker.postMessage({ type: 'flush', id } satisfies FlushMessage);
        });
    }

    async close(): Promise<void> {
        await this.worker.terminate();
    }
}

/** 書き込みのスレッドの中 (storeWriterThread.ts が呼ぶ) */
export const runStoreWriter = (): void => {
    if (!parentPort) throw new Error('runStoreWriter must run in a worker thread');
    const port = parentPort;
    const backend = new SqliteStoreBackend((workerData as { dir: string }).dir);
    let error: string | undefined;
    port.on('message', (message: WriteMessage | FlushMessage) => {
        if (message.type === 'write') {
            try {
                // まとめて 1 つのトランザクションにする (単位ごとに確定しない)
                if (!backend.db.isTransaction) backend.db.exec('BEGIN');
                // writeParsed の中身は同じ流れで終わる (誤りは次のメッセージの前に拾える)
                backend.writeParsed(...message.args).catch((e: unknown) => {
                    error ??= e instanceof Error ? e.message : String(e);
                });
            } catch (e) {
                error ??= e instanceof Error ? e.message : String(e);
            }
            return;
        }
        try {
            if (backend.db.isTransaction) backend.db.exec('COMMIT');
        } catch (e) {
            error ??= e instanceof Error ? e.message : String(e);
        }
        port.postMessage({ id: message.id, ...(error ? { error } : {}) } satisfies Reply);
        error = undefined;
    });
};
