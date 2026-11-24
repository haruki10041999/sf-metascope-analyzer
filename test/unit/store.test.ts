import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { baselineOf, currentBaselineOf } from '../../docs/examples/analysis/scripts/baseline';
import { repositoryOf } from '../../docs/examples/paths';
import {
    ProjectTree,
    Repository,
    RepositoryProcessor,
    UnitStore,
    WorkingTree,
    analyzeDependencies,
    closeAllStoreBackends,
    manifestUnitOf,
} from '../../src/analyzer/unit';
import type { SqliteStoreBackend } from '../../src/analyzer/unit/storeSqlite';
import { DERIVED_VERSION } from '../../src/analyzer/unit/dependencies';
import { UNIT_FORMAT_VERSIONS } from '../../src/analyzer/unit/unitType';

// 保存の置き場 (docs/save-format-plan.md 4.3 のテスト。段階 S1〜S5。保存の形は SQLite: docs/implementation-roadmap.md の Q1)

/** 置き場のデータベース (表を直接見る・書き換える) */
const databaseOf = (processor: RepositoryProcessor) =>
    (processor.store.backend as SqliteStoreBackend).db;

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
    after(async () => {
        closeAllStoreBackends();
        await rm(tmp, { recursive: true, force: true });
    });

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

    it('writes parsed results on a writer thread and reads them back the same (M5)', async () => {
        // 書き込みのスレッド (storeWriter.ts)。読み込みの終わりと保存の始めに書き終わるのを待つ
        const writerRoot = path.join(tmp, 'saved-writer');
        const store = new UnitStore(path.join(writerRoot, 'store'), root);
        store.useWriterThread();
        try {
            const repository = await store.loadTree(new ProjectTree(new WorkingTree(root)));
            // 読み込みが終わった時点で、別のスレッドの書き込みは確定している
            const written = (store.backend as SqliteStoreBackend).db
                .prepare('SELECT count(*) AS n FROM unit')
                .get() as { n: number };
            assert.equal(written.n, countUnits(repository));
            await store.save(repository);
        } finally {
            store.close();
        }
        const reloaded = new UnitStore(path.join(writerRoot, 'store'), root);
        try {
            const before = await reloaded.loadBefore();
            const parsed = await Repository.load(new ProjectTree(new WorkingTree(root)));
            assert.deepEqual(contentsOf(before), contentsOf(parsed));
            assert.equal(reloaded.stats.parsed, 0);
        } finally {
            reloaded.close();
        }
    });

    it('stores units as node rows, sources by hash, positions without the source text, and drops the old msgpack files', async () => {
        // 前の版の置き場 (msgpack のファイル) は、開いたときに消す
        const store = path.join(savingRoot, 'store');
        await writeFile(path.join(store, 'manifest.msgpack'), 'old');
        const processor = await RepositoryProcessor.create(savingRoot, root);
        await assert.rejects(readFile(path.join(store, 'manifest.msgpack')));
        const db = databaseOf(processor);
        // 解析結果の filePath はリポジトリからの相対パス、版は系統の版
        const apex = db
            .prepare("SELECT root, format_version FROM unit WHERE type = 'apexClass' LIMIT 1")
            .get() as { root: string; format_version: string };
        assert.ok(!path.isAbsolute(JSON.parse(apex.root).filePath));
        assert.equal(apex.format_version, `${UNIT_FORMAT_VERSIONS.apex}.0`);
        // ノード (JsonType を 1 行) と位置
        const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
        assert.ok(count('SELECT count(*) AS n FROM node') > 1000);
        // 位置のソースの文字列 (context) は持たず、単位のファイルから切り出す
        assert.ok(count('SELECT count(*) AS n FROM span') > 1000);
        assert.equal(count('SELECT count(*) AS n FROM span WHERE context IS NOT NULL'), 0);
        // ソースは目録のファイルの hash ごとに 1 つ
        const manifest = (await processor.store.readManifest())!;
        const hashes = new Set(manifest.units.flatMap((u) => u.files.map((f) => f.hash)));
        const stored = new Set(
            (db.prepare('SELECT hash FROM source').all() as { hash: string }[]).map((r) => r.hash),
        );
        assert.deepEqual(stored, hashes);
    });

    it('reparses only the units of a lineage whose format version changed (from the saved sources)', async () => {
        // apex の系統の版を上げたのと同じ: 保存した Apex の解析結果の版を古くする
        const current = await RepositoryProcessor.create(savingRoot, root);
        databaseOf(current)
            .prepare("UPDATE unit SET format_version = '0.0' WHERE type = 'apexClass'")
            .run();
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

    it('saves definitions and references per unit and reads them back without rebuilding (S4)', async () => {
        const processor = await RepositoryProcessor.create(savingRoot, root);
        await processor.save();
        const units = countUnits(processor.after);
        const db = databaseOf(processor);
        const keys = (sql: string) =>
            (db.prepare(sql).all() as { key: string }[]).map((r) => r.key).sort();
        // 解析結果と同じ key で、定義・参照がある
        assert.deepEqual(
            keys('SELECT u.key AS key FROM derived d JOIN unit u ON u.id = d.unit_id'),
            keys('SELECT key FROM unit'),
        );

        const reloaded = await RepositoryProcessor.create(savingRoot, root);
        assert.equal(reloaded.store.stats.parsed, 0);
        assert.equal(reloaded.store.stats.derivedLoaded, units);
        // 読んだ定義・参照から組んだグラフは、すべて作り直したものと同じ
        assert.deepEqual(
            baselineOf(analyzeDependencies(reloaded.after)),
            await currentBaselineOf('after'),
        );
        // 何も変えずに保存し直しても、定義・参照は書かない
        await reloaded.save();
        assert.equal(reloaded.store.stats.derivedWritten, 0);

        // 派生の版を上げたのと同じ: 保存した定義・参照の版を古くする
        db.prepare('UPDATE derived SET derived_version = 0').run();
        const bumped = await RepositoryProcessor.create(savingRoot, root);
        // parse はやり直さず (解析結果を読む)、定義・参照だけを作り直す
        assert.equal(bumped.store.stats.parsed, 0);
        assert.equal(bumped.store.stats.derivedLoaded, 0);
        assert.deepEqual(
            baselineOf(analyzeDependencies(bumped.after)),
            await currentBaselineOf('after'),
        );
        await bumped.save();
        assert.equal(bumped.store.stats.derivedWritten, units);
        const versions = db.prepare('SELECT DISTINCT derived_version AS v FROM derived').all() as {
            v: number;
        }[];
        assert.deepEqual(
            versions.map((r) => r.v),
            [DERIVED_VERSION],
        );
    });

    it('skips reading files whose size and modified time are unchanged (S5)', async () => {
        // 1 時間前に書いたことにする (hash を取った時点で更新されたばかりのファイルは信用しないため)
        const old = new Date(Date.now() - 60 * 60 * 1000);
        const touchAll = async (dir: string): Promise<void> => {
            for (const entry of await readdir(dir, { withFileTypes: true })) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) await touchAll(full);
                else await utimes(full, old, old);
            }
        };
        await touchAll(root);
        const processor = await RepositoryProcessor.create(savingRoot, root);
        await processor.save();
        const unitFiles = processor.store.stats.hashed + processor.store.stats.statHits;

        // 起動し直しても、大きさ・更新時刻が同じファイルは読まずに前回の hash を使う
        const reloaded = await RepositoryProcessor.create(savingRoot, root);
        assert.equal(reloaded.store.stats.hashed, 0);
        assert.equal(reloaded.store.stats.statHits, unitFiles);
        assert.equal(reloaded.store.stats.parsed, 0);
        assert.deepEqual(contentsOf(reloaded.after), contentsOf(processor.after));

        // 中身 (大きさ) を変えたファイルは読み直し、その単位だけ parse する
        const service = path.join(
            root,
            'force-app',
            'main',
            'default',
            'classes',
            'AccountService.cls',
        );
        const original = await readFile(service, 'utf8');
        await writeFile(service, original.replace(/}\s*$/, '    public void s5() {}\n}\n'));
        try {
            const parsedBefore = reloaded.store.stats.parsed;
            const hashedBefore = reloaded.store.stats.hashed;
            await reloaded.reset();
            assert.equal(reloaded.store.stats.hashed - hashedBefore, 1);
            assert.equal(reloaded.store.stats.parsed - parsedBefore, 1);
            assert.equal(
                reloaded.getUnitDiffs('apexClass').filter((d) => d.status !== 'unchanged').length,
                1,
            );
            // 更新されたばかりのファイルは、大きさ・更新時刻が同じでも次も読み直す
            await reloaded.save();
            const again = await RepositoryProcessor.create(savingRoot, root);
            assert.equal(again.store.stats.hashed, 1);
        } finally {
            await writeFile(service, original);
            await utimes(service, old, old);
        }
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
