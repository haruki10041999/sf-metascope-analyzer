import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { z } from 'zod';

// git の範囲で比べる 2 つの時点 (docs/implementation-roadmap.md の R5。report-components-plan.md 3.1 の残り)。
// { from: 'main' } は main...作業ツリー (分岐した時点と今の作業ツリー)、{ from: 'main', to: 'HEAD' } は main...HEAD

/** 作業ツリー (未コミットの変更を含む今の状態) */
export const WORKING_TREE = 'WORKTREE';

export const CompareRange = z
    .object({
        from: z
            .string()
            .min(1)
            .describe('Base revision (branch, tag or commit), e.g. main or origin/main.'),
        to: z
            .string()
            .min(1)
            .exactOptional()
            .describe(`Target revision. Omit (or ${WORKING_TREE}) for the working tree.`),
        mergeBase: z
            .boolean()
            .exactOptional()
            .describe(
                'true (default) compares from the point where to branched off from (like main...HEAD). false compares from itself.',
            ),
    })
    .describe(
        'Two points of git to compare. Omit to compare the saved baseline with the working tree.',
    );
export type CompareRange = z.infer<typeof CompareRange>;

/** 解決した範囲 (コミットのハッシュ。after が作業ツリーなら WORKTREE) */
export type ResolvedRange = {
    /** git のリポジトリのルート */
    gitRoot: string;
    /** git のルートから、解析するリポジトリ (sfdx のプロジェクト) までのパス ('' はルート) */
    subdirectory: string;
    before: string;
    after: string;
    /** 表示用 (main...HEAD (abc1234..def5678) など) */
    label: string;
};

const execFileAsync = promisify(execFile);

const git = async (cwd: string, args: string[]): Promise<string> =>
    (await execFileAsync('git', args, { cwd, maxBuffer: 1024 * 1024 * 16 })).stdout.trim();

/** リビジョンをコミットのハッシュにする (なければ分かるエラー) */
const commitOf = async (gitRoot: string, revision: string): Promise<string> => {
    try {
        return await git(gitRoot, ['rev-parse', '--verify', '--quiet', `${revision}^{commit}`]);
    } catch {
        throw new Error(`git のリビジョンがありません: ${revision}`);
    }
};

/** 範囲を、2 つのコミット (after は作業ツリーもある) にする */
export const resolveCompareRange = async (
    repositoryRoot: string,
    range: CompareRange,
): Promise<ResolvedRange> => {
    const gitRoot = await git(repositoryRoot, ['rev-parse', '--show-toplevel']).catch(() => {
        throw new Error(`git のリポジトリではありません: ${repositoryRoot}`);
    });
    // git のルートからのパスは git に聞く (Windows の短い名前 (HARUKI~1 など) と長い名前のずれを避ける)
    const subdirectory = (await git(repositoryRoot, ['rev-parse', '--show-prefix'])).replace(
        /\/+$/,
        '',
    );
    const toWorkingTree = range.to === undefined || range.to === WORKING_TREE;
    const after = toWorkingTree ? WORKING_TREE : await commitOf(gitRoot, range.to!);
    const from = await commitOf(gitRoot, range.from);
    // 分岐した時点 (作業ツリーなら HEAD との分岐点)
    const before =
        range.mergeBase === false
            ? from
            : await git(gitRoot, ['merge-base', from, toWorkingTree ? 'HEAD' : after]).catch(() => {
                  throw new Error(`共通の祖先がありません: ${range.from} と ${range.to ?? 'HEAD'}`);
              });
    const short = (commit: string) => (commit === WORKING_TREE ? '作業ツリー' : commit.slice(0, 7));
    const separator = range.mergeBase === false ? '..' : '...';
    return {
        gitRoot,
        subdirectory,
        before,
        after,
        label: `${range.from}${separator}${range.to ?? '作業ツリー'} (${short(before)} → ${short(after)})`,
    };
};
