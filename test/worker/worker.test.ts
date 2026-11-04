import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import {
    ApexWorker,
    ObjectTranslationWorker,
    ObjectWorker,
    runWorkerTask,
} from '../../src/analyzer/worker';

/** ApexWorker / ObjectWorker (メインスレッドで処理) で、サンプルを解析・保存・読み込みする */

let tmp: string;
before(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'worker-'));
});
after(async () => {
    await rm(tmp, { recursive: true, force: true });
});

describe('ApexWorker', () => {
    it('parses and saves source and metadata files, then loads them back', async () => {
        const outDir = path.join(tmp, 'apex');
        const worker = new ApexWorker({ outDir, concurrency: 2 });
        const results = await worker.parseAndSaveAll(path.resolve('docs/examples/apex-diff/after'));
        assert.ok(results.every((r) => r.ok));

        // 保存名は、ソースは apex_、メタデータは apexMeta_ を付けた ID (ApexParser.saveApexFile)
        const ids = await worker.listSavedIds();
        assert.ok(ids.includes('apex_AccountService.cls'));
        assert.ok(ids.includes('apexMeta_AccountService.cls-meta.xml'));

        const meta = await worker.load('apexMeta_AccountService.cls-meta.xml');
        assert.equal(meta.dataType, 'apexClassMeta');
        const loaded = await worker.loadAll();
        assert.equal(loaded.length, ids.length);
        await worker.close();
    });
});

describe('ObjectWorker', () => {
    it('parses and saves object folders, then loads them back', async () => {
        const outDir = path.join(tmp, 'objects');
        const worker = new ObjectWorker({ outDir });
        const objects = path.resolve('docs/examples/metadata/after/force-app/main/default/objects');
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
                ['Payment__c', 0],
            ],
        );

        const invoice = await worker.load('Invoice__c');
        assert.equal(invoice.dataType, 'object');
        assert.equal((await worker.loadAll()).length, 6);
    });

    it('runs a single task by command and type', async () => {
        const parsed = await runWorkerTask({
            command: 'parse',
            type: 'Object',
            filePath: path.resolve(
                'docs/examples/metadata/after/force-app/main/default/objects/Payment__c',
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
            path.resolve('docs/examples/metadata/after/force-app/main/default/objectTranslations'),
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
