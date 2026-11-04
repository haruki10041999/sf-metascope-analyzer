import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { GitDiffFile, GitDiffTarget, GitParser } from '../../src/analyzer/parser/git';

/**
 * 一時ディレクトリに次の状態のリポジトリを作る。
 * - コミット 1: A.cls / B.cls / Old.cls / note.txt
 * - コミット 2: A.cls を変更、B.cls を削除、Old.cls → New.cls にリネーム、C.trigger を追加
 * - staged:    note.txt を変更して add
 * - unstaged:  A.cls を変更 (add しない)、Untracked.cls を新規作成 (add しない)
 */
let repo: string;

const git = (...args: string[]) =>
    execFileSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args], {
        cwd: repo,
        encoding: 'utf8',
    });

const write = async (file: string, content: string) => {
    await mkdir(path.dirname(path.join(repo, file)), { recursive: true });
    await writeFile(path.join(repo, file), content);
};

const summary = (files: GitDiffFile[]) =>
    files
        .map((f) => [f.status, f.path, f.oldPath ?? null])
        .sort((a, b) => String(a[1]).localeCompare(String(b[1])));

before(async () => {
    repo = await mkdtemp(path.join(os.tmpdir(), 'git-diff-test-'));
    git('init', '-q', '-b', 'main');
    git('config', 'core.autocrlf', 'false');

    await write('classes/A.cls', 'public class A { Integer x = 1; }\n');
    await write('classes/B.cls', 'public class B {}\n');
    await write(
        'classes/Old.cls',
        'public class Old {\n    // 同じ中身ならリネームとして検出される\n}\n',
    );
    await write('note.txt', 'note\n');
    git('add', '.');
    git('commit', '-q', '-m', 'first');

    await write('classes/A.cls', 'public class A { Integer x = 2; }\n');
    git('rm', '-q', 'classes/B.cls');
    git('mv', 'classes/Old.cls', 'classes/New.cls');
    await write('triggers/C.trigger', 'trigger C on Account (before insert) {}\n');
    git('add', '.');
    git('commit', '-q', '-m', 'second');

    await write('note.txt', 'note (staged)\n');
    git('add', 'note.txt');

    await write('classes/A.cls', 'public class A { Integer x = 3; }\n');
    await write('classes/Untracked.cls', 'public class Untracked {}\n');
});

after(async () => {
    await rm(repo, { recursive: true, force: true });
});

describe('GitParser.getDiffFiles', () => {
    it('lists files changed between commits, with renames', async () => {
        const result = await GitParser.getDiffFiles(
            { mode: 'committed', from: 'HEAD~1' },
            { cwd: repo },
        );

        assert.equal(
            result.root,
            path.resolve(
                execFileSync('git', ['rev-parse', '--show-toplevel'], {
                    cwd: repo,
                    encoding: 'utf8',
                }).trim(),
            ),
        );
        assert.deepEqual(summary(result.files), [
            ['modified', 'classes/A.cls', null],
            ['deleted', 'classes/B.cls', null],
            ['renamed', 'classes/New.cls', 'classes/Old.cls'],
            ['added', 'triggers/C.trigger', null],
        ]);
    });

    it('lists staged files only', async () => {
        const result = await GitParser.getDiffFiles({ mode: 'staged' }, { cwd: repo });
        assert.deepEqual(summary(result.files), [['modified', 'note.txt', null]]);
    });

    it('lists unstaged files, and untracked files when requested', async () => {
        const tracked = await GitParser.getDiffFiles({ mode: 'unstaged' }, { cwd: repo });
        assert.deepEqual(summary(tracked.files), [['modified', 'classes/A.cls', null]]);

        const all = await GitParser.getDiffFiles(
            { mode: 'unstaged', includeUntracked: true },
            { cwd: repo },
        );
        assert.deepEqual(summary(all.files), [
            ['modified', 'classes/A.cls', null],
            ['added', 'classes/Untracked.cls', null],
        ]);
    });

    it('filters by extension and path, from a subdirectory', async () => {
        const target: GitDiffTarget = { mode: 'committed', from: 'HEAD~1', to: 'HEAD' };
        const byExtension = await GitParser.getDiffFiles(target, {
            cwd: path.join(repo, 'classes'),
            extensions: ['.TRIGGER'],
        });
        assert.deepEqual(summary(byExtension.files), [['added', 'triggers/C.trigger', null]]);

        const byPath = await GitParser.getDiffFiles(target, {
            cwd: repo,
            paths: ['classes/A.cls'],
        });
        assert.deepEqual(summary(byPath.files), [['modified', 'classes/A.cls', null]]);
    });

    it('fails with the git message for an unknown revision', async () => {
        await assert.rejects(
            GitParser.getDiffFiles({ mode: 'committed', from: 'no-such-revision' }, { cwd: repo }),
            /git .*diff .* failed: fatal: bad revision 'no-such-revision'/,
        );
    });
});

describe('GitParser.readDiffFileContent', () => {
    const find = (files: GitDiffFile[], p: string) => files.find((f) => f.path === p)!;

    it('reads both sides of a committed diff (renamed file uses the old path before)', async () => {
        const result = await GitParser.getDiffFiles(
            { mode: 'committed', from: 'HEAD~1' },
            { cwd: repo },
        );

        const a = find(result.files, 'classes/A.cls');
        assert.equal(
            await GitParser.readDiffFileContent(result, a, 'before'),
            'public class A { Integer x = 1; }\n',
        );
        assert.equal(
            await GitParser.readDiffFileContent(result, a, 'after'),
            'public class A { Integer x = 2; }\n',
        );

        const renamed = find(result.files, 'classes/New.cls');
        assert.equal(
            await GitParser.readDiffFileContent(result, renamed, 'before'),
            await GitParser.readDiffFileContent(result, renamed, 'after'),
        );

        const deleted = find(result.files, 'classes/B.cls');
        assert.equal(await GitParser.readDiffFileContent(result, deleted, 'after'), undefined);
        const added = find(result.files, 'triggers/C.trigger');
        assert.equal(await GitParser.readDiffFileContent(result, added, 'before'), undefined);
    });

    it('reads HEAD / index for staged, and index / working tree for unstaged', async () => {
        const staged = await GitParser.getDiffFiles({ mode: 'staged' }, { cwd: repo });
        const note = find(staged.files, 'note.txt');
        assert.equal(await GitParser.readDiffFileContent(staged, note, 'before'), 'note\n');
        assert.equal(await GitParser.readDiffFileContent(staged, note, 'after'), 'note (staged)\n');

        const unstaged = await GitParser.getDiffFiles(
            { mode: 'unstaged', includeUntracked: true },
            { cwd: repo },
        );
        const a = find(unstaged.files, 'classes/A.cls');
        assert.equal(
            await GitParser.readDiffFileContent(unstaged, a, 'before'),
            'public class A { Integer x = 2; }\n',
        );
        assert.equal(
            await GitParser.readDiffFileContent(unstaged, a, 'after'),
            'public class A { Integer x = 3; }\n',
        );

        const untracked = find(unstaged.files, 'classes/Untracked.cls');
        assert.equal(await GitParser.readDiffFileContent(unstaged, untracked, 'before'), undefined);
        assert.equal(
            await GitParser.readDiffFileContent(unstaged, untracked, 'after'),
            'public class Untracked {}\n',
        );
    });

    it('reads the merge base as the before side when mergeBase is set', async () => {
        // ブランチを切り替えるため、staged / unstaged の変更を退避する (このファイルの最後のテスト)
        git('stash', 'push', '-q', '--include-untracked');
        git('switch', '-q', '-c', 'feature', 'HEAD~1');
        await write('classes/Feature.cls', 'public class Feature {}\n');
        git('add', 'classes/Feature.cls');
        git('commit', '-q', '-m', 'feature');

        // main...feature は分岐点 (コミット 1) から feature まで。main 側のコミット 2 の変更は含まない
        const result = await GitParser.getDiffFiles(
            { mode: 'committed', from: 'main', to: 'feature', mergeBase: true },
            { cwd: repo, extensions: ['.cls'] },
        );
        assert.deepEqual(summary(result.files), [['added', 'classes/Feature.cls', null]]);
    });
});
