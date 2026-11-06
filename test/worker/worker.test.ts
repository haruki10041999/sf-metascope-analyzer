import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import {
    ApexWorker,
    LwcWorker,
    ObjectTranslationWorker,
    ObjectWorker,
    runWorkerTask,
} from '../../src/analyzer/worker';

/** ApexWorker / ObjectWorker / LwcWorker (メインスレッドで処理) で、サンプルを解析・保存・読み込みする */

let tmp: string;
before(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'worker-'));
});
after(async () => {
    await rm(tmp, { recursive: true, force: true });
});

describe('ApexWorker', () => {
    it('1 単位 (クラス・トリガーはソースと -meta.xml、匿名 Apex は 1 ファイル) を 1 件として解析・保存し、読み込める', async () => {
        const outDir = path.join(tmp, 'apex');
        const worker = new ApexWorker({ outDir, concurrency: 2 });
        const results = await worker.parseAndSaveAll(
            path.resolve('docs/examples/apex/samples/diff/after'),
        );
        assert.ok(results.every((r) => r.ok));

        // 保存名は class_ / trigger_ / anonymous_ を付けた単位の id (ApexParser.saveApexUnit)
        const ids = await worker.listSavedIds();
        assert.deepEqual(ids, [
            'anonymous_script',
            'class_AccountService',
            'class_Broken',
            'class_Level',
            'class_NewHelper',
            'class_Shape',
            'class_Unchanged',
            'trigger_AccountTrigger',
        ]);

        const unit = await worker.load('class_AccountService');
        assert.equal(unit.dataType, 'apexUnit');
        assert.equal(unit.result.base.source?.fileType, 'cls');
        assert.equal(unit.result.base.meta?.meta.kind, 'apexClassMeta');
        const loaded = await worker.loadAll();
        assert.equal(loaded.length, ids.length);
        await worker.close();
    });
});

describe('ObjectWorker', () => {
    it('parses and saves object folders, then loads them back', async () => {
        const outDir = path.join(tmp, 'objects');
        const worker = new ObjectWorker({ outDir });
        const objects = path.resolve(
            'docs/examples/metadata/samples/after/force-app/main/default/objects',
        );
        const results = await worker.parseAndSaveAll(objects);
        assert.ok(results.every((r) => r.ok));
        assert.deepEqual(
            results.flatMap((r) => (r.ok ? [[r.result.id, r.result.syntaxErrorCount]] : [])),
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

        const invoice = await worker.load('Invoice__c');
        assert.equal(invoice.dataType, 'object');
        assert.equal((await worker.loadAll()).length, 7);
    });

    it('runs a single task by command and type', async () => {
        const parsed = await runWorkerTask({
            command: 'parse',
            type: 'Object',
            filePath: path.resolve(
                'docs/examples/metadata/samples/after/force-app/main/default/objects/Payment__c',
            ),
        });
        assert.equal(parsed.result.id, 'Payment__c');
    });
});

describe('ObjectTranslationWorker', () => {
    it('parses and saves translation folders with a prefix, then loads them back', async () => {
        const outDir = path.join(tmp, 'objectTranslations');
        const worker = new ObjectTranslationWorker({ outDir });
        const results = await worker.parseAndSaveAll(
            path.resolve(
                'docs/examples/metadata/samples/after/force-app/main/default/objectTranslations',
            ),
        );
        assert.deepEqual(
            results.flatMap((r) => (r.ok ? [[r.result.id, r.result.syntaxErrorCount]] : [])),
            [
                ['Account-ja', 0],
                ['Broken__c-ja', 1],
                ['Invoice__c-en_US', 0],
                ['Invoice__c-ja', 0],
            ],
        );
        assert.ok((await worker.listSavedIds()).every((id) => id.startsWith('objectTranslation_')));
        const loaded = await worker.load('Invoice__c-ja');
        assert.equal(loaded.dataType, 'objectTranslation');
        assert.equal((await worker.loadAll()).length, 4);
    });
});

describe('LwcWorker', () => {
    it('1 バンドル (フォルダ) を 1 件として解析・保存し、読み込める', async () => {
        const outDir = path.join(tmp, 'lwc');
        const worker = new LwcWorker({ outDir, concurrency: 2 });
        // lwc フォルダの上を渡すと、lwc/<名前>/ のフォルダを探す
        const results = await worker.parseAndSaveAll(
            path.resolve('docs/examples/lwc/samples/bundles/force-app'),
        );
        assert.ok(results.every((r) => r.ok));
        assert.deepEqual(
            results.map((r) => (r.ok ? [r.result.id, r.result.dataType] : [])),
            [
                ['accountList', 'lwcBundle'],
                ['accountRow', 'lwcBundle'],
                ['broken', 'lwcBundle'],
                ['utils', 'lwcBundle'],
            ],
        );

        // 保存名は lwc_<バンドル名> (LwcParser.saveLwcBundle)。1 バンドル = 1 ファイル
        const ids = await worker.listSavedIds();
        assert.deepEqual(ids, ['lwc_accountList', 'lwc_accountRow', 'lwc_broken', 'lwc_utils']);

        const loaded = await worker.load('lwc_accountList');
        assert.equal(loaded.dataType, 'lwcBundle');
        if (loaded.dataType === 'lwcBundle') {
            assert.deepEqual(
                [
                    loaded.result.base.modules.length,
                    loaded.result.base.templates.length,
                    loaded.result.base.stylesheets.length,
                    loaded.result.base.meta?.kind,
                ],
                [1, 1, 1, 'lwcBundleMeta'],
            );
        }
        await worker.close();
    });

    it('runWorkerTask でも Lwc を扱える', async () => {
        const parsed = await runWorkerTask({
            command: 'parse',
            type: 'Lwc',
            filePath: path.resolve(
                'docs/examples/lwc/samples/bundles/force-app/main/default/lwc/accountRow',
            ),
        });
        assert.equal(parsed.result.id, 'accountRow');
    });
});
