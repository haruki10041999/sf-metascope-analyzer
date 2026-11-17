import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';

import { METADATA_FOLDER_PARSERS } from '../../src/analyzer/parser/Metadata/folders';
import { findUnitType } from '../../src/analyzer/unit';
import { UnitWorker, runUnitTask } from '../../src/analyzer/worker';

/** UnitWorker (メインスレッドで処理) で、サンプルの単位を種類ごとに解析する (保存は UnitStore が行う) */

const repository = (side: 'before' | 'after') => path.resolve('docs/examples/repository', side);

const typesOf = (...names: string[]) => names.map((name) => findUnitType(name)!);

describe('UnitWorker: Apex', () => {
    it('1 単位 (クラス・トリガーはソースと -meta.xml、匿名 Apex は 1 ファイル) を 1 件として解析する', async () => {
        const worker = new UnitWorker({ concurrency: 2 });
        const types = typesOf('apexClass', 'apexTrigger', 'anonymousApex');
        const results = await worker.parseAll(repository('after'), types);
        assert.ok(results.every((r) => r.ok));

        // id は class_ / trigger_ / anonymous_ を付けた単位の名前
        const ids = results.flatMap((r) => (r.ok ? [r.result.result.id] : [])).sort();
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

        const unit = (await worker.parse(
            'apexClass',
            repository('after'),
            'force-app/main/default/classes/AccountService.cls',
        )) as unknown as {
            dataType: string;
            result: { base: { source?: { fileType: string }; meta?: { meta: { kind: string } } } };
        };
        assert.equal(unit.dataType, 'apexUnit');
        assert.equal(unit.result.base.source?.fileType, 'cls');
        assert.equal(unit.result.base.meta?.meta.kind, 'apexClassMeta');
        await worker.close();
    });
});

describe('UnitWorker: オブジェクト・翻訳', () => {
    it('オブジェクトのフォルダを解析する', async () => {
        const worker = new UnitWorker({});
        const results = await worker.parseAll(repository('after'), typesOf('object'));
        assert.deepEqual(
            results.flatMap((r) =>
                r.ok ? [[r.result.result.id, r.result.resolvedError.length]] : [],
            ),
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
        assert.ok(results.every((r) => r.ok && r.result.dataType === 'object'));
    });

    it('翻訳を解析する', async () => {
        const worker = new UnitWorker({});
        const results = await worker.parseAll(repository('after'), typesOf('objectTranslation'));
        assert.deepEqual(
            results.flatMap((r) =>
                r.ok ? [[r.result.result.id, r.result.resolvedError.length]] : [],
            ),
            [
                ['Account-ja', 0],
                ['Broken__c-ja', 1],
                ['Invoice__c-en_US', 0],
                ['Invoice__c-ja', 0],
            ],
        );
        assert.ok(results.every((r) => r.ok && r.result.dataType === 'objectTranslation'));
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
    it('1 バンドル (フォルダ) を 1 件として解析する', async () => {
        const worker = new UnitWorker({ concurrency: 2 });
        const results = await worker.parseAll(repository('before'), typesOf('lwc'));
        assert.ok(results.every((r) => r.ok));
        assert.deepEqual(
            results.map((r) => (r.ok ? [r.result.result.id, r.result.dataType] : [])),
            [
                ['accountList', 'lwcBundle'],
                ['accountRow', 'lwcBundle'],
                ['broken', 'lwcBundle'],
                ['oldBanner', 'lwcBundle'],
                ['utils', 'lwcBundle'],
            ],
        );
        const accountList = results.find((r) => r.ok && r.result.result.id === 'accountList');
        assert.ok(accountList?.ok);
        const base = (
            accountList.result as unknown as {
                result: {
                    base: {
                        modules: unknown[];
                        templates: unknown[];
                        stylesheets: unknown[];
                        meta?: { kind: string };
                    };
                };
            }
        ).result.base;
        assert.deepEqual(
            [base.modules.length, base.templates.length, base.stylesheets.length, base.meta?.kind],
            [1, 1, 1, 'lwcBundleMeta'],
        );
        await worker.close();
    });
});

describe('UnitWorker: フォルダ単位のメタデータ', () => {
    it('ファイル (単位) ごとに解析する。すべての種類のフォルダを読む', async () => {
        const worker = new UnitWorker({ concurrency: 2 });
        const types = METADATA_FOLDER_PARSERS.map((parser) => findUnitType(parser.spec.type)!);
        const results = await worker.parseAll(repository('after'), types);
        assert.ok(results.every((r) => r.ok));
        // サンプルにはすべての種類がある
        assert.deepEqual(
            [...new Set(results.map((r) => r.input.unitType))].sort(),
            types.map((t) => t.type).sort(),
        );
        const flow = results.find((r) => r.ok && r.result.result.id === 'flow_Account_Wizard');
        assert.equal(flow?.ok && flow.result.dataType, 'flow');
        await worker.close();
    });
});
