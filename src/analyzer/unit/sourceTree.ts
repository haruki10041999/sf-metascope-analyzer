import { type ChildProcessWithoutNullStreams, execFile, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { readSource } from '../parser/commons';

// 単位の種類 (unitType.ts) が読む「ファイルの木」。作業ツリーと git のある時点 (コミット・index) を同じ形で読む。
// パスはどれもリポジトリ (root) からの相対パスで、区切りは /。方針: docs/analysis-plan.md 2 章

/** 探さないフォルダ */
const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', '.sfdx', '.sf']);

export interface SourceTree {
    /** 木の根 (作業ツリーのルートの絶対パス。結果の filePath を作るのに使う) */
    readonly root: string;
    /** 何の木か (作業ツリー、git のコミットなど。メッセージ用) */
    readonly label: string;
    /** すべてのファイルのパス (名前の順) */
    listFiles(): Promise<string[]>;
    /** ファイルの中身 (改行は LF にそろえる)。なければ undefined */
    readFile(filePath: string): Promise<string | undefined>;
}

const toPosix = (p: string) => p.split(path.sep).join('/');

const isIgnored = (filePath: string) =>
    filePath.split('/').some((part) => IGNORED_DIRECTORIES.has(part));

/** 作業ツリー (ファイルシステム) */
export class WorkingTree implements SourceTree {
    readonly label = 'working tree';
    private files?: Promise<string[]>;

    constructor(readonly root: string) {}

    listFiles(): Promise<string[]> {
        this.files ??= fs
            .readdir(this.root, { recursive: true, withFileTypes: true })
            .catch(() => [])
            .then((entries) =>
                entries
                    .filter((entry) => entry.isFile())
                    .map((entry) =>
                        toPosix(path.relative(this.root, path.join(entry.parentPath, entry.name))),
                    )
                    .filter((filePath) => !isIgnored(filePath))
                    .sort(),
            );
        return this.files;
    }

    readFile(filePath: string): Promise<string | undefined> {
        return readSource(path.join(this.root, filePath)).catch(() => undefined);
    }
}

const execFileAsync = promisify(execFile);

const git = async (cwd: string, args: string[]): Promise<string> =>
    (await execFileAsync('git', args, { cwd, maxBuffer: 1024 * 1024 * 512 })).stdout;

/**
 * git のある時点の木。revision はコミット (HEAD・ブランチ名・ハッシュ) か、'' (index)。
 * gitRoot は git のリポジトリのルート (GitParser.getRepositoryRoot)。subdirectory を渡すと、
 * その下 (sfdx のプロジェクトなど) を木の根にする (パスは subdirectory からの相対パス)
 */
export class GitTree implements SourceTree {
    readonly root: string;
    /** subdirectory (/ 区切り、前後の / なし)。なければ '' */
    private readonly base: string;
    private files?: Promise<string[]>;

    constructor(
        readonly gitRoot: string,
        readonly revision: string,
        subdirectory = '',
    ) {
        this.base = toPosix(subdirectory).replace(/^\/+|\/+$/g, '');
        this.root = this.base ? path.join(gitRoot, this.base) : gitRoot;
    }

    get label(): string {
        return this.revision === '' ? 'git index' : `git ${this.revision}`;
    }

    listFiles(): Promise<string[]> {
        const prefix = this.base ? `${this.base}/` : '';
        this.files ??= (
            this.revision === ''
                ? git(this.gitRoot, ['ls-files', '-z', '--full-name'])
                : git(this.gitRoot, [
                      'ls-tree',
                      '-r',
                      '-z',
                      '--full-name',
                      '--name-only',
                      this.revision,
                  ])
        ).then((out) =>
            out
                .split('\0')
                .filter((filePath) => filePath !== '' && filePath.startsWith(prefix))
                .map((filePath) => filePath.slice(prefix.length))
                .filter((filePath) => !isIgnored(filePath))
                .sort(),
        );
        return this.files;
    }

    async readFile(filePath: string): Promise<string | undefined> {
        const fullPath = this.base ? `${this.base}/${filePath}` : filePath;
        this.reader ??= new CatFileReader(this.gitRoot);
        const content = await this.reader.read(`${this.revision}:${fullPath}`);
        return content?.toString('utf8').replace(/\r\n?/g, '\n');
    }

    /** git cat-file のプロセスを終える (読み終わったら呼ぶ。呼ばなくても、プロセスの終了で終わる) */
    close(): void {
        this.reader?.close();
        this.reader = undefined;
    }

    private reader?: CatFileReader | undefined;
}

/**
 * `git cat-file --batch` を 1 つ起動して、オブジェクト (<revision>:<path>) の中身を順に読む
 * (ファイルごとに git show を起動すると、大きいリポジトリで遅いため)
 */
class CatFileReader {
    private readonly process: ChildProcessWithoutNullStreams;
    private buffer = Buffer.alloc(0);
    private readonly queue: {
        resolve: (content: Buffer | undefined) => void;
        reject: (error: Error) => void;
    }[] = [];

    constructor(cwd: string) {
        this.process = spawn('git', ['cat-file', '--batch'], { cwd });
        this.process.stdout.on('data', (chunk: Buffer) => {
            this.buffer = Buffer.concat([this.buffer, chunk]);
            this.drain();
        });
        this.process.on('error', (error) => this.failAll(error));
        this.process.on('close', () => this.failAll(new Error('git cat-file exited')));
        // 終わるのを待たない (読み込みが終われば、親のプロセスの終了を止めない)
        this.process.unref();
        (this.process.stdout as unknown as { unref?: () => void }).unref?.();
        (this.process.stdin as unknown as { unref?: () => void }).unref?.();
    }

    read(object: string): Promise<Buffer | undefined> {
        return new Promise((resolve, reject) => {
            this.queue.push({ resolve, reject });
            this.process.stdin.write(`${object}\n`);
        });
    }

    close(): void {
        this.process.stdin.end();
    }

    /** たまった出力から、答えを順に取り出す */
    private drain(): void {
        for (;;) {
            const newline = this.buffer.indexOf(0x0a);
            if (newline < 0 || this.queue.length === 0) return;
            const header = this.buffer.subarray(0, newline).toString('utf8');
            if (header.endsWith(' missing') || header.endsWith(' ambiguous')) {
                this.buffer = this.buffer.subarray(newline + 1);
                this.queue.shift()!.resolve(undefined);
                continue;
            }
            // <sha> <type> <size>\n<content>\n
            const size = Number(header.split(' ')[2]);
            if (!Number.isFinite(size)) {
                this.failAll(new Error(`unexpected git cat-file output: ${header}`));
                return;
            }
            if (this.buffer.length < newline + 1 + size + 1) return;
            const content = this.buffer.subarray(newline + 1, newline + 1 + size);
            this.buffer = this.buffer.subarray(newline + 1 + size + 1);
            const type = header.split(' ')[1];
            this.queue.shift()!.resolve(type === 'blob' ? Buffer.from(content) : undefined);
        }
    }

    private failAll(error: Error): void {
        while (this.queue.length) this.queue.shift()!.reject(error);
    }
}
