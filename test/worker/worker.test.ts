import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { METADATA_FOLDER_PARSERS } from '../../src/analyzer/parser/Metadata/folders';
import { findUnitType } from '../../src/analyzer/unit';
import { UnitWorker, runUnitTask } from '../../src/analyzer/worker';

/** UnitWorker (メインスレッドで処理) で、サンプルの単位を種類ごとに解析・保存・読み込みする */

const repository = (side: 'before' | 'after') =>
    path.resolve('docs/examples/repository', side);

let tmp: string;
before(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'worker-'));
});
after(async () => {
    await rm(tmp, { recursive: true, force: true });
});

const typesOf = (...names: string[]) => names.map((name) => findUnitType(name)!);

describe('UnitWorker: Apex', () => {
    it('1 単位 (クラス・トリガーはソースと -meta.xml、匿名 Apex は 1 ファイル) を 1 件として解析・保存し、読み込める', async () => {
        const worker = new UnitWorker({ outDir: path.join(tmp, 'apex'), concurrency: 2 });
        const types = typesOf('apexClass', 'apexTrigger', 'anonymousApex');
        const results = await worker.parseAndSaveAll(repository('after'), types);
        assert.ok(results.every((r) => r.ok));

        // 保存名は class_ / trigger_ / anonymous_ を付けた単位の id
        const ids = await worker.listSavedIds(types);
        assert.deepEqual(ids, [
            'anonymous_broken',
            'anonymous_parser',
            'anonymous_script',
            'class_AccountService',
            'class_Broken',
            'class_Level',
            'class_NewHelper',
            'class_ParserEnum',
            'class_ParserInterface',
            'class_ParserTest',
            'class_Shape',
            'class_Unchanged',
            'trigger_AccountTrigger',
            'trigger_ParserTrigger',
        ]);

        const unit = (await worker.load('class_AccountService')) as unknown as {
            dataType: string;
            result: { base: { source?: { fileType: string }; meta?: { meta: { kind: string } } } };
        };
        assert.equal(unit.dataType, 'apexUnit');
        assert.equal(unit.result.base.source?.fileType, 'cls');
        assert.equal(unit.result.base.meta?.meta.kind, 'apexClassMeta');
        const loaded = await worker.loadAll(repository('after'), types);
        assert.equal(
            types.reduce((n, t) => n + loaded.get(t.type).length, 0),
            ids.length,
        );
        await worker.close();
    });
});

describe('UnitWorker: オブジェクト・翻訳', () => {
    it('オブジェクトのフォルダを解析・保存し、読み込める', async () => {
        const worker = new UnitWorker({ outDir: path.join(tmp, 'objects') });
        const types = typesOf('object');
        const results = await worker.parseAndSaveAll(repository('after'), types);
        assert.deepEqual(
            results.flatMap((r) => (r.ok ? [[r.result.id, r.result.errorCount]] : [])),
            [
                ['Account', 0],
                ['App_Setting__mdt', 0],
                ['Broken__c', 2],
                ['Invoice_Line__c', 0],
                ['Invoice__c', 0],
                ['Opportunity', 0],
                ['Payment__c', 0],
            ],
        );
        assert.ok((await worker.listSavedIds(types)).every((id) => id.startsWith('object_')));
        const invoice = await worker.load('object_Invoice__c');
        assert.equal(invoice.dataType, 'object');
        assert.equal((await worker.loadAll(repository('after'), types)).get('object').length, 7);
    });

    it('翻訳は objectTranslation_ を付けて保存する', async () => {
        const worker = new UnitWorker({ outDir: path.join(tmp, 'objectTranslations') });
        const types = typesOf('objectTranslation');
        const results = await worker.parseAndSaveAll(repository('after'), types);
        assert.deepEqual(
            results.flatMap((r) => (r.ok ? [[r.result.id, r.result.errorCount]] : [])),
            [
                ['Account-ja', 0],
                ['Broken__c-ja', 1],
                ['Invoice__c-en_US', 0],
                ['Invoice__c-ja', 0],
            ],
        );
        assert.ok(
            (await worker.listSavedIds(types)).every((id) => id.startsWith('objectTranslation_')),
        );
        const loaded = await worker.load('objectTranslation_Invoice__c-ja');
        assert.equal(loaded.dataType, 'objectTranslation');
    });

    it('runUnitTask で 1 単位を解析できる', async () => {
        const parsed = await runUnitTask({
            command: 'parse',
            unitType: 'object',
            root: repository('after'),
            location: 'force-app/main/default/objects/Payment__c',
        });
        assert.equal(parsed.result.id, 'Payment__c');
    });
});

describe('UnitWorker: LWC', () => {
    it('1 バンドル (フォルダ) を 1 件として解析・保存し、読み込める', async () => {
        const worker = new UnitWorker({ outDir: path.join(tmp, 'lwc'), concurrency: 2 });
        const types = typesOf('lwc');
        const results = await worker.parseAndSaveAll(repository('before'), types);
        assert.ok(results.every((r) => r.ok));
        assert.deepEqual(
            results.map((r) => (r.ok ? [r.result.id, r.result.dataType] : [])),
            [
                ['accountList', 'lwcBundle'],
                ['accountRow', 'lwcBundle'],
                ['broken', 'lwcBundle'],
                ['oldBanner', 'lwcBundle'],
                ['utils', 'lwcBundle'],
            ],
        );
        // 保存名は lwc_<バンドル名>。1 バンドル = 1 ファイル
        assert.deepEqual(await worker.listSavedIds(types), [
            'lwc_accountList',
            'lwc_accountRow',
            'lwc_broken',
            'lwc_oldBanner',
            'lwc_utils',
        ]);
        const loaded = (await worker.load('lwc_accountList')) as unknown as {
            dataType: string;
            result: {
                base: {
                    modules: unknown[];
                    templates: unknown[];
                    stylesheets: unknown[];
                    meta?: { kind: string };
                };
            };
        };
        assert.equal(loaded.dataType, 'lwcBundle');
        assert.deepEqual(
            [
                loaded.result.base.modules.length,
                loaded.result.base.templates.length,
                loaded.result.base.stylesheets.length,
                loaded.result.base.meta?.kind,
            ],
            [1, 1, 1, 'lwcBundleMeta'],
        );
        await worker.close();
    });
});

describe('UnitWorker: フォルダ単位のメタデータ', () => {
    it('保存・読み込みはファイル (単位) ごと。すべての種類のフォルダを読む', async () => {
        const worker = new UnitWorker({ outDir: path.join(tmp, 'folders'), concurrency: 2 });
        const types = METADATA_FOLDER_PARSERS.map((parser) => findUnitType(parser.spec.type)!);
        const results = await worker.parseAndSaveAll(repository('after'), types);
        assert.ok(results.every((r) => r.ok));
        // サンプルにはすべての種類がある
        assert.deepEqual(
            [...new Set(results.flatMap((r) => (r.ok ? [r.result.unitType] : [])))].sort(),
            types.map((t) => t.type).sort(),
        );
        const ids = await worker.listSavedIds(types);
        assert.deepEqual(ids, results.flatMap((r) => (r.ok ? [r.result.saveId] : [])).sort());
        const loaded = await worker.load('flow_Account_Wizard');
        assert.equal(loaded.dataType, 'flow');
        await worker.close();
    });
});
