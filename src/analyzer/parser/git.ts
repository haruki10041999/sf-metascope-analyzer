import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * どの差分を取るか。
 * - committed: 2 つのコミットの間 (`git diff <from> <to>`)。to を省略すると HEAD
 * - staged:    HEAD と index の間 (`git diff --cached`)。コミット前に add したもの
 * - unstaged:  index と作業ツリーの間 (`git diff`)。add していない変更
 */
export type GitDiffTarget =
    | {
          mode: 'committed';
          from: string;
          to?: string;
          /** true なら from と to の分岐点からの差分 (`from...to`。プルリクエストと同じ見え方) */
          mergeBase?: boolean;
      }
    | { mode: 'staged' }
    | {
          mode: 'unstaged';
          /** true なら、まだ git が追跡していないファイル (untracked) も added として含める */
          includeUntracked?: boolean;
      };

export type GitDiffOptions = {
    /** リポジトリの中のディレクトリ。省略時はカレントディレクトリ */
    cwd?: string;
    /** 対象を絞る拡張子 (例: ['.cls', '.trigger', '.apex'])。大文字小文字は区別しない */
    extensions?: string[];
    /** 対象を絞るパス (git の pathspec。例: ['force-app/main/default/classes']) */
    paths?: string[];
};

export type GitDiffStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'unmerged';

/** 差分のあったファイル 1 件。パスはリポジトリのルートからの相対パス (区切りは /) */
export type GitDiffFile = {
    status: GitDiffStatus;
    /** 変更後のパス (deleted は変更前のパス) */
    path: string;
    /** renamed / copied のときの変更前のパス */
    oldPath?: string;
    /** renamed / copied の類似度 (0〜100) */
    similarity?: number;
};

export type GitDiffResult = {
    /** リポジトリのルートの絶対パス */
    root: string;
    target: GitDiffTarget;
    files: GitDiffFile[];
};

const STATUS: Record<string, GitDiffStatus> = {
    A: 'added',
    M: 'modified',
    T: 'modified',
    D: 'deleted',
    R: 'renamed',
    C: 'copied',
    U: 'unmerged',
};

const runGit = async (cwd: string, args: string[]): Promise<string> => {
    try {
        const { stdout } = await execFileAsync('git', args, {
            cwd,
            encoding: 'utf8',
            maxBuffer: 256 * 1024 * 1024,
            windowsHide: true,
        });
        return stdout;
    } catch (error) {
        const stderr = (error as { stderr?: string }).stderr?.trim();
        throw new Error(`git ${args.join(' ')} failed${stderr ? `: ${stderr}` : ''}`);
    }
};

/** `--name-status -z` の出力を読む。renamed / copied は「状態、変更前、変更後」の 3 つが並ぶ */
const parseNameStatus = (output: string): GitDiffFile[] => {
    const tokens = output.split('\0').filter((token) => token !== '');
    const files: GitDiffFile[] = [];

    for (let i = 0; i < tokens.length;) {
        const code = tokens[i++]!;
        const status = STATUS[code[0]!];
        if (!status) {
            throw new Error(`unknown git diff status: ${code}`);
        }

        if (status === 'renamed' || status === 'copied') {
            const oldPath = tokens[i++]!;
            const newPath = tokens[i++]!;
            files.push({ status, path: newPath, oldPath, similarity: Number(code.slice(1)) });
        } else {
            files.push({ status, path: tokens[i++]! });
        }
    }

    return files;
};

const diffArgs = (target: GitDiffTarget): string[] => {
    switch (target.mode) {
        case 'committed': {
            const to = target.to ?? 'HEAD';
            return target.mergeBase ? [`${target.from}...${to}`] : [target.from, to];
        }
        case 'staged':
            return ['--cached'];
        case 'unstaged':
            return [];
    }
};

const matchesExtension = (file: GitDiffFile, extensions: string[] | undefined): boolean => {
    if (!extensions || extensions.length === 0) {
        return true;
    }
    const normalized = extensions.map((extension) => extension.toLowerCase());
    // 拡張子が変わったリネームも拾うため、変更前・変更後のどちらかが合えば対象にする
    return [file.path, file.oldPath].some(
        (p) => p !== undefined && normalized.includes(path.extname(p).toLowerCase()),
    );
};

export class GitParser {
    /** cwd を含むリポジトリのルートの絶対パス */
    static async getRepositoryRoot(cwd: string = process.cwd()): Promise<string> {
        return path.resolve((await runGit(cwd, ['rev-parse', '--show-toplevel'])).trim());
    }

    /** git diff で、差分のあったファイルの一覧を取る */
    static async getDiffFiles(
        target: GitDiffTarget,
        options: GitDiffOptions = {},
    ): Promise<GitDiffResult> {
        const root = await GitParser.getRepositoryRoot(options.cwd);
        // `--` でリビジョンとパスを区切る (同じ名前のファイルがあってもリビジョンとして読ませる)
        const pathspec = ['--', ...(options.paths ?? [])];

        // パスをリポジトリのルートからの相対にそろえるため、ルートで実行する
        const output = await runGit(root, [
            '-c',
            'core.quotePath=false',
            'diff',
            '--name-status',
            '-z',
            '--find-renames',
            '--no-ext-diff',
            ...diffArgs(target),
            ...pathspec,
        ]);
        const files = parseNameStatus(output);

        if (target.mode === 'unstaged' && target.includeUntracked) {
            const untracked = await runGit(root, [
                'ls-files',
                '--others',
                '--exclude-standard',
                '-z',
                ...pathspec,
            ]);
            untracked
                .split('\0')
                .filter((p) => p !== '')
                .forEach((p) => files.push({ status: 'added', path: p }));
        }

        return {
            root,
            target,
            files: files.filter((file) => matchesExtension(file, options.extensions)),
        };
    }

    /**
     * 差分のファイルの、変更前 (before) / 変更後 (after) の中身。その側にファイルがなければ undefined。
     * - committed: before は from (mergeBase なら分岐点)、after は to のコミットの中身
     * - staged:    before は HEAD、after は index の中身
     * - unstaged:  before は index、after は作業ツリーの中身
     */
    static async readDiffFileContent(
        result: GitDiffResult,
        file: GitDiffFile,
        side: 'before' | 'after',
    ): Promise<string | undefined> {
        if (side === 'before' && file.status === 'added') {
            return undefined;
        }
        if (side === 'after' && file.status === 'deleted') {
            return undefined;
        }

        const filePath = side === 'before' ? (file.oldPath ?? file.path) : file.path;
        const { target, root } = result;

        if (side === 'after' && target.mode === 'unstaged') {
            return fs.readFile(path.join(root, filePath), 'utf-8');
        }

        return runGit(root, ['show', `${await GitParser.getRevision(result, side)}:${filePath}`]);
    }

    /** `git show <revision>:<path>` の revision。index は空文字 (`:<path>`) */
    private static async getRevision(
        { target, root }: GitDiffResult,
        side: 'before' | 'after',
    ): Promise<string> {
        switch (target.mode) {
            case 'committed': {
                const to = target.to ?? 'HEAD';
                if (side === 'after') {
                    return to;
                }
                return target.mergeBase
                    ? (await runGit(root, ['merge-base', target.from, to])).trim()
                    : target.from;
            }
            case 'staged':
                return side === 'before' ? 'HEAD' : '';
            case 'unstaged':
                return '';
        }
    }
}
