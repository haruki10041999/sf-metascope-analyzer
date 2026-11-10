import assert from 'node:assert/strict';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { RepositoryProcessor } from '../../src/analyzer/unit/processor';
import { runDiff } from '../../docs/examples/metadata/scripts/run-diff';
import { countDiffKinds, ALL_KINDS } from '../../docs/examples/metadata/scripts/run-diff';

/** docs/examples/metadata の翻訳のサンプルの Diff と網羅。README.md の期待どおりかを確かめる */

type Node = Record<string, any>;
type Result = Awaited<ReturnType<typeof runDiff>>;
let result: Result;

before(async () => {
    result = await runDiff();
});

const unit = (id: string) => result.translationDiffs.find((d) => d.id === id)!;
const fieldsOf = (id: string) => (unit(id).content as Node).fields as Node;
const coverage = (id: string) => result.coverages.find((c) => c.id === id)!;

describe('object translation diff (docs/examples/metadata)', () => {
    it('matches translations by <object>-<locale> and reports the status', () => {
        assert.deepEqual(
            result.translationDiffs.map((d) => [d.id, d.status]),
            [
                ['Account-ja', 'added'],
                ['Broken__c-ja', 'changed'],
                ['Invoice__c-en_US', 'unchanged'],
                ['Invoice__c-ja', 'changed'],
                ['Legacy_Item__c-ja', 'removed'],
            ],
        );
    });

    it('reports every translation kind as a diff node', () => {
        const counts = new Map<string, number>();
        countDiffKinds(result.translationDiffs, counts);
        const translationKinds = ALL_KINDS.filter((kind) => kind.endsWith('Translation'));
        assert.deepEqual(
            translationKinds.filter((kind) => !counts.has(kind)),
            [],
        );
    });

    it('pairs field translations by name and picklist values by masterLabel', () => {
        const fields = fieldsOf('Invoice__c-ja').fields as Node[];
        const changed = fields.filter((f) => f.status !== 'unchanged');
        assert.deepEqual(
            changed.map((f) => [f.status, f.match, f.fields.name.value]),
            [
                ['changed', 'key', 'Account__c'],
                ['changed', 'key', 'Status__c'],
            ],
        );
        const status = changed[1]!.fields;
        assert.deepEqual(status.label, { status: 'changed', before: 'ステータス', after: '状態' });
        assert.deepEqual(
            (status.picklistValues as Node[]).map((v) => [
                v.status,
                v.value?.masterLabel ?? v.fields?.masterLabel.value,
            ]),
            [
                ['unchanged', 'Draft'],
                ['removed', 'Sent'],
                ['unchanged', 'Paid'],
            ],
        );
        // 両方にない値は出さない
        assert.ok(!('help' in status) && !('lookupFilter' in status));
    });

    it('keeps the position-only change unchanged and reports unreadable files', () => {
        const en = unit('Invoice__c-en_US');
        assert.equal(en.status, 'unchanged');
        assert.deepEqual(
            unit('Broken__c-ja').resolvedError.map((e) => e.status),
            ['added'],
        );
        // after は項目の翻訳が読めないので fields を持たない (エラーのノードはない) → 配列ごと removed
        const brokenFields = fieldsOf('Broken__c-ja').fields as Node;
        assert.equal(brokenFields.status, 'removed');
        assert.deepEqual(
            (brokenFields.value as Node[]).map((f) => f.kind),
            ['fieldTranslation'],
        );
    });
});

describe('translation coverage (docs/examples/metadata)', () => {
    it('counts the status of every translatable item', () => {
        assert.deepEqual(coverage('Invoice__c-ja').counts, {
            translated: 8,
            missing: 5,
            sameAsSource: 1,
            orphan: 1,
            outdated: 2,
        });
    });

    it('finds missing, same-as-source, orphan and outdated translations', () => {
        const items = coverage('Invoice__c-ja').items.filter((i) => i.status !== 'translated');
        assert.deepEqual(
            items.map((i) => [i.status, i.kind, i.name]),
            [
                ['missing', 'fieldLabel', 'Approved__c'],
                ['sameAsSource', 'fieldLabel', 'Due_Date__c'],
                ['missing', 'fieldLabel', 'Is_Overdue__c'],
                ['orphan', 'fieldLabel', 'Note__c'],
                ['missing', 'fieldHelp', 'Amount__c'],
                ['missing', 'picklistValue', 'Status__c.Overdue'],
                ['outdated', 'picklistValue', 'Status__c.Paid'],
                ['outdated', 'validationRule', 'Amount_Positive'],
                ['missing', 'validationRule', 'Due_Date_Required'],
            ],
        );
        const outdated = items.find((i) => i.name === 'Amount_Positive')!;
        assert.equal(outdated.source, 'Amount must be greater than zero.');
        assert.equal(outdated.translation, '金額は正の値にしてください。');
        assert.ok(outdated.sourceKeys.object && outdated.sourceKeys.translation);
    });

    it('does not treat standard field translations as orphans', () => {
        const account = coverage('Account-ja');
        assert.equal(account.objectFound, true);
        assert.deepEqual(
            account.items.map((i) => [i.status, i.kind, i.name]),
            [
                ['translated', 'fieldLabel', 'Name'],
                ['translated', 'fieldLabel', 'Tier__c'],
                ['missing', 'picklistValue', 'Tier__c.Bronze'],
                ['translated', 'picklistValue', 'Tier__c.Gold'],
                ['translated', 'picklistValue', 'Tier__c.Platinum'],
                ['translated', 'picklistValue', 'Tier__c.Silver'],
                ['translated', 'validationRule', 'Name_Required'],
            ],
        );
    });
});

describe('MetadataProcessor with object translations', () => {
    let root: string;
    before(async () => {
        root = await mkdtemp(path.join(os.tmpdir(), 'translation-processor-'));
    });
    after(async () => {
        await rm(root, { recursive: true, force: true });
    });

    it('saves translations separately and diffs the repository against them', async () => {
        const repository = path.join(root, 'repo');
        const saveRoot = path.join(root, 'save');
        await cp(path.resolve('docs/examples/repository/before'), repository, {
            recursive: true,
        });

        const processor = await RepositoryProcessor.create(saveRoot, repository);
        await processor.save();
        assert.deepEqual(
            processor.getObjectTranslationUnitDiffs().map((d) => d.status),
            ['unchanged', 'unchanged', 'unchanged', 'unchanged'],
        );

        await rm(repository, { recursive: true, force: true });
        await cp(path.resolve('docs/examples/repository/after'), repository, {
            recursive: true,
        });
        await processor.reset();
        assert.deepEqual(
            processor.getObjectTranslationUnitDiffs().map((d) => [d.id, d.status]),
            result.translationDiffs.map((d) => [d.id, d.status]),
        );
        // オブジェクトの差分は翻訳の保存データを含まない
        assert.deepEqual(
            processor.getObjectUnitDiffs().map((d) => d.id),
            result.diffs.map((d) => d.id),
        );

        const coverages = processor.getTranslationCoverages({ locales: ['ja'] });
        assert.deepEqual(
            coverages.map((c) => c.id),
            ['Account-ja', 'Broken__c-ja', 'Invoice__c-ja'],
        );
        assert.deepEqual(
            coverages.find((c) => c.id === 'Invoice__c-ja')?.counts,
            coverage('Invoice__c-ja').counts,
        );
    });
});
