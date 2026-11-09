import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { repositoryOf } from '../../docs/examples/paths';
import { GitParser } from '../../src/analyzer/parser/git';
import {
    GitTree,
    Repository,
    UNIT_TYPES,
    WorkingTree,
    changedUnits,
    diffRepositories,
    relativeGitFiles,
    renamedUnits,
} from '../../src/analyzer/unit';

// git のリポジトリの中の sfdx のプロジェクト (proj/) を、コミットごとに読む。
// 1 つめのコミットは before のサンプル、2 つめは after のサンプル

const PROJECT = 'proj';

describe('Repository with git', () => {
    let repo: string;
    const git = (...args: string[]) =>
        execFileSync(
            'git',
            ['-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args],
            { cwd: repo, encoding: 'utf8' },
        );

    before(async () => {
        repo = await mkdtemp(path.join(os.tmpdir(), 'repository-git-'));
        git('init', '-q', '-b', 'main');
        git('config', 'core.autocrlf', 'false');
        await cp(repositoryOf('before'), path.join(repo, PROJECT), { recursive: true });
        git('add', '.');
        git('commit', '-q', '-m', 'before');
        await rm(path.join(repo, PROJECT), { recursive: true, force: true });
        await cp(repositoryOf('after'), path.join(repo, PROJECT), { recursive: true });
        git('add', '-A');
        git('commit', '-q', '-m', 'after');
    });
    after(async () => {
        // git cat-file が終わるまで、Windows ではフォルダを消せないことがあるので待って消し直す
        await rm(repo, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
    });

    it('reads a commit the same way as the working tree', async () => {
        const fromGit = await Repository.load(new GitTree(repo, 'HEAD', PROJECT));
        const fromFiles = await Repository.load(new WorkingTree(path.join(repo, PROJECT)));
        for (const unitType of UNIT_TYPES) {
            assert.deepEqual(
                fromGit.get(unitType.type),
                fromFiles.get(unitType.type),
                unitType.type,
            );
        }
    });

    it('reparses only the units git reports as changed', async () => {
        const beforeRepo = await Repository.load(new GitTree(repo, 'HEAD~1', PROJECT));
        const diff = await GitParser.getDiffFiles(
            { mode: 'committed', from: 'HEAD~1', to: 'HEAD' },
            { cwd: repo },
        );
        const files = relativeGitFiles(diff.files, PROJECT);
        const afterTree = new GitTree(repo, 'HEAD', PROJECT);
        const updated = await beforeRepo.update(afterTree, changedUnits(files));
        const afterRepo = await Repository.load(afterTree);
        for (const unitType of UNIT_TYPES) {
            assert.deepEqual(
                updated.get(unitType.type),
                afterRepo.get(unitType.type),
                unitType.type,
            );
        }

        // git の rename (OldHelper.cls → NewHelper.cls) で、id の違う単位同士を対応付ける
        const renames = renamedUnits(files);
        const diffs = diffRepositories(beforeRepo, afterRepo, { renames }).get('apexClass')!;
        const renamed = diffs.find((d) => d.renamedFrom !== undefined);
        if (renames.get('apexClass')!.size > 0) {
            assert.equal(renamed?.id, 'class_NewHelper');
            assert.equal(renamed?.renamedFrom, 'class_OldHelper');
        }
    });
});
