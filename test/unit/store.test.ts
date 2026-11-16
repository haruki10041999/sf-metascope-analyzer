import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { Packr } from 'msgpackr';

import { baselineOf, currentBaselineOf } from '../../docs/examples/analysis/scripts/baseline';
import { repositoryOf } from '../../docs/examples/paths';
import {
    ProjectTree,
    Repository,
    RepositoryProcessor,
    WorkingTree,
    analyzeDependencies,
    manifestUnitOf,
} from '../../src/analyzer/unit';
import { UNIT_FORMAT_VERSIONS } from '../../src/analyzer/unit/unitType';

// 保存の置き場 (docs/save-format-plan.md 4.3 のテスト。段階 S1〜S3)

const packr = new Packr({ useRecords: true });

/** 種類 → id → 解析結果の JSON (filePath を除く) */
const contentsOf = (repository: Repository) =>
    Object.fromEntries(
        repository
            .entries()
            .map(([type, results]) => [
                type,
                Object.fromEntries(
                    results.map(({ filePath: _filePath, ...rest }) => [rest.result.id, rest]),
                ),
            ]),
    );

const countUnits = (repository: Repository, types?: string[]) =>
    repository
        .entries()
        .filter(([type]) => !types || types.includes(type))
        .reduce((n, [, results]) => n + results.length, 0);

describe('UnitStore (保存の置き場)', () => {
    let tmp: string;
    let root: string;
    let savingRoot: string;

    before(async () => {
        tmp = await mkdtemp(path.join(os.tmpdir(), 'store-'));
        root = path.join(tmp, 'repository');
        savingRoot = path.join(tmp, 'saved');
        await cp(repositoryOf('after'), root, { recursive: true });
    });
    after(() => rm(tmp, { recursive: true, force: true }));

    it('saves and reads back the same before as the parsed working tree', async () => {
        const processor = await RepositoryProcessor.create(savingRoot, root);
        assert.equal(await processor.hasSaved(), false);
        assert.equal(countUnits(processor.before), 0);
        await processor.save();
        assert.equal(await processor.hasSaved(), true);

        const reloaded = await RepositoryProcessor.create(savingRoot, root);
        const parsed = await Repository.load(new ProjectTree(new WorkingTree(root)));
        assert.deepEqual(contentsOf(reloaded.before), contentsOf(parsed));
        // 何も変えていなければ、どの単位も parse せずに読む
        assert.equal(reloaded.store.stats.parsed, 0);
        // before と after の同じ単位は、同じ解析結果のオブジェクト
        assert.equal(reloaded.before.get('apexClass')[0], reloaded.after.get('apexClass')[0]);
        // filePath はリポジトリのルートからの絶対パスに戻す
        const [account] = reloaded.before.get('object').filter((r) => r.result.id === 'Account');
        assert.equal(
            reloaded.before.locationOf(account!),
            'force-app/main/default/objects/Account',
        );
    });

    it('stores relative file paths, sources by hash and drops the old units folder', async () => {
        const store = path.join(savingRoot, 'store');
        const [key] = await readdir(path.join(store, 'parsed', 'apexClass'));
        const saved = packr.unpack(await readFile(path.join(store, 'parsed', 'apexClass', key!)));
        assert.ok(!path.isAbsolute(saved.data.filePath), saved.data.filePath);
        assert.equal(saved.formatVersion, `${UNIT_FORMAT_VERSIONS.apex}.0`);
        const manifest = packr.unpack(await readFile(path.join(store, 'manifest.msgpack')));
        const hashes = new Set(
            manifest.units.flatMap((u: { files: { hash: string }[] }) =>
                u.files.map((f) => `${f.hash}.msgpack`),
            ),
        );
        assert.deepEqual(new Set(await readdir(path.join(store, 'sources'))), hashes);
    });

    it('reparses only the units of a lineage whose format version changed (from the saved sources)', async () => {
        // apex の系統の版を上げたのと同じ: 保存した Apex の解析結果の版を古くする
        const dir = path.join(savingRoot, 'store', 'parsed', 'apexClass');
        for (const name of await readdir(dir)) {
            const file = path.join(dir, name);
            const saved = packr.unpack(await readFile(file));
            await writeFile(file, packr.pack({ ...saved, formatVersion: '0.0' }));
        }
        // 作業ツリーの Apex を消しても、before は保存したソースから作り直せる
        const classes = path.join(root, 'force-app', 'main', 'default', 'classes');
        const backup = path.join(tmp, 'classes');
        await cp(classes, backup, { recursive: true });
        await rm(classes, { recursive: true });
        try {
            const processor = await RepositoryProcessor.create(savingRoot, root);
            const apexClasses = processor.before.get('apexClass').length;
            assert.ok(apexClasses > 0);
            assert.equal(processor.store.stats.parsed, apexClasses);
            assert.equal(processor.after.get('apexClass').length, 0);
            const parsed = await Repository.load(
                new ProjectTree(new WorkingTree(repositoryOf('after'))),
            );
            assert.deepEqual(contentsOf(processor.before).apexClass, contentsOf(parsed).apexClass);
        } finally {
            await cp(backup, classes, { recursive: true });
        }
    });

    it('parses only the changed units on reset (change, add, remove)', async () => {
        const processor = await RepositoryProcessor.create(savingRoot, root);
        await processor.save();
        const classes = path.join(root, 'force-app', 'main', 'default', 'classes');
        const service = path.join(classes, 'AccountService.cls');
        const original = await readFile(service, 'utf8');
        await writeFile(
            service,
            original.replace(/}\s*$/, '    public void addedByTest() {}\n}\n'),
        );
        await writeFile(path.join(classes, 'Added.cls'), 'public class Added {}');
        const parsedBefore = processor.store.stats.parsed;
        try {
            await processor.reset();
            assert.equal(processor.store.stats.parsed - parsedBefore, 2);
            const ids = processor.after.get('apexClass').map((r) => r.result.id);
            assert.ok(ids.includes('class_Added'));
            const diffs = processor.getUnitDiffs('apexClass');
            assert.equal(diffs.find((d) => d.id === 'class_Added')?.status, 'added');
            assert.equal(
                diffs.filter((d) => d.status !== 'unchanged' && d.id !== 'class_Added').length,
                1,
            );
        } finally {
            await writeFile(service, original);
            await rm(path.join(classes, 'Added.cls'));
        }
        await processor.reset();
        assert.ok(processor.getUnitDiffs('apexClass').every((d) => d.status === 'unchanged'));
    });

    it('keeps the previous before when a save stops before the manifest is written', async () => {
        const processor = await RepositoryProcessor.create(savingRoot, root);
        await processor.save();
        const units = countUnits(processor.before);
        // 置き場で読んでいない解析結果を混ぜると、目録を書く前に止まる
        const broken = Repository.of(
            root,
            new Map([['apexClass', [{ ...processor.after.get('apexClass')[0]! }]]]),
        );
        await assert.rejects(processor.store.save(broken), /Not loaded by the store/);
        const reloaded = await RepositoryProcessor.create(savingRoot, root);
        assert.equal(countUnits(reloaded.before), units);
    });

    it('builds the same dependency graph from reused results as from a full parse', async () => {
        const processor = await RepositoryProcessor.create(savingRoot, root);
        await processor.reset();
        assert.ok(manifestUnitOf(processor.after.get('object')[0]!));
        assert.deepEqual(
            baselineOf(analyzeDependencies(processor.after)),
            await currentBaselineOf('after'),
        );
    });
});
