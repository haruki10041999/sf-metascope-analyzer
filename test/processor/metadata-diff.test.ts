import assert from 'node:assert/strict';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { ALL_KINDS, countDiffKinds, runDiff } from '../../docs/examples/metadata/scripts/run-diff';
import { MetadataProcessor } from '../../src/analyzer/processor/Metadata/metadata';

/**
 * docs/examples/metadata の before / after を本番と同じ流れで読んで比べ、
 * README.md に書いた期待どおりの差分になるかを確かめる。
 */

type Node = Record<string, any>;
type Result = Awaited<ReturnType<typeof runDiff>>;

const isRecord = (value: unknown): value is Node =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** 差分の木から status を持つノードを前順で集める */
const collect = (diff: unknown, out: Node[] = []): Node[] => {
    if (Array.isArray(diff)) {
        diff.forEach((d) => collect(d, out));
    } else if (isRecord(diff)) {
        if (typeof diff.status === 'string') out.push(diff);
        Object.values(diff).forEach((value) => collect(value, out));
    }
    return out;
};

let result: Result;
const unit = (id: string) => result.diffs.find((d) => d.id === id)!;
const fields = (id: string) => (unit(id).content as Node).fields as Node;

describe('metadata diff samples (docs/examples/metadata)', () => {
    before(async () => {
        result = await runDiff();
    });

    it('reports every kind as a diff node', () => {
        const counts = new Map<string, number>();
        countDiffKinds(result.diffs, counts);
        // 翻訳の kind は test/processor/object-translation.test.ts で確かめる
        assert.deepEqual(
            ALL_KINDS.filter((kind) => !kind.endsWith('Translation') && !counts.has(kind)),
            [],
        );
    });

    it('pairs objects by API name', () => {
        assert.deepEqual(
            result.diffs.map((d) => [d.id, d.status]),
            [
                ['Account', 'changed'],
                ['App_Setting__mdt', 'unchanged'],
                ['Broken__c', 'changed'],
                ['Invoice__c', 'changed'],
                ['Invoice_Line__c', 'changed'],
                ['Legacy_Item__c', 'removed'],
                ['Payment__c', 'added'],
            ],
        );
        // 空行を足しただけ (位置だけの変化) は unchanged。objectKey は単体、sourceKey は { before, after }
        const setting = unit('App_Setting__mdt').content as Node;
        assert.equal(setting.status, 'unchanged');
        assert.equal(typeof setting.sourceKeys.objectKey, 'string');
        assert.ok('before' in setting.sourceKeys.sourceKey);
    });

    it('omits properties that neither side has, and reports one-sided ones as added / removed', () => {
        // Amount__c: inlineHelpText は after にだけある。description はどちらにもないので出さない
        const amount = fields('Invoice__c').fields.find(
            (f: Node) => f.fields?.apiName?.value === 'Amount__c',
        );
        assert.deepEqual(amount.fields.inlineHelpText, { status: 'added', value: '税込みの金額' });
        assert.ok(!('description' in amount.fields));
        assert.ok(!('valueSet' in amount.fields));

        // Tier__c: required は before にだけある
        const tier = fields('Account').fields[0];
        assert.deepEqual(tier.fields.required, { status: 'removed', value: false });

        // Account: 入力規則は after にだけある (フォルダごと追加) ので、配列ごと added
        const account = fields('Account');
        assert.equal(account.validationRules.status, 'added');
        // 配列の要素も kind / sourceKeys を中身から分ける
        assert.deepEqual(
            account.validationRules.value.map((rule: Node) => [
                rule.kind,
                typeof rule.sourceKeys.objectKey,
                rule.value.fullName,
                'kind' in rule.value,
            ]),
            [['validationRule', 'string', 'Name_Required', false]],
        );
        // どちらにもない子 (fieldSets など) は出さない
        assert.ok(
            !('fieldSets' in account) && !('recordTypes' in account) && !('webLinks' in account),
        );

        // 値が 1 つも unchanged の空のプロパティを持たない
        assert.ok(
            collect(result.diffs).every(
                (n) => !(n.status === 'unchanged' && 'value' in n && n.value === undefined),
            ),
        );
    });

    it('pairs members by name and diffs their properties', () => {
        const invoice = fields('Invoice__c');
        assert.deepEqual(
            invoice.fields
                .filter((f: Node) => f.status !== 'unchanged')
                .map((f: Node) => [f.status, f.kind]),
            [
                ['changed', 'field'],
                ['changed', 'field'],
                ['removed', 'field'],
                ['changed', 'field'],
                ['added', 'field'],
            ],
        );
        const amount = invoice.fields.find((f: Node) => f.fields?.apiName?.value === 'Amount__c');
        assert.deepEqual(amount.fields.precision, { status: 'changed', before: 18, after: 16 });
        assert.equal(amount.match, 'key');

        // 選択リスト値は fullName で対応付ける (ラベルだけの変更は changed、Sent は removed、Overdue は added)
        const status = invoice.fields.find((f: Node) => f.fields?.apiName?.value === 'Status__c');
        assert.deepEqual(
            status.fields.valueSet.values
                .filter((v: Node) => v.status !== 'unchanged')
                .map((v: Node) => [v.status, v.value?.fullName ?? v.fields.fullName.value]),
            [
                ['removed', 'Sent'],
                ['changed', 'Paid'],
                ['added', 'Overdue'],
            ],
        );

        assert.deepEqual(
            invoice.validationRules.map((r: Node) => r.status),
            ['changed', 'added'],
        );
        assert.deepEqual(invoice.validationRules[0].fields.errorMessage, {
            status: 'changed',
            before: 'Amount must be positive.',
            after: 'Amount must be greater than zero.',
        });
    });

    it('treats ordered lists as sequences and record type values as sets', () => {
        const columns = fields('Account').listViews[0].fields.columns as Node[];
        assert.deepEqual(
            columns.map((c) => [c.status, c.value]),
            [
                ['unchanged', 'ACCOUNT.NAME'],
                ['moved', 'ACCOUNT.TYPE'],
                ['unchanged', 'Tier__c'],
            ],
        );
        const picklist = fields('Invoice__c').recordTypes[0].fields.picklistValues[0];
        assert.deepEqual(
            picklist.fields.values.map((v: Node) => [v.status, v.value.fullName]),
            [
                ['unchanged', 'Draft'],
                ['removed', 'Sent'],
                ['added', 'Overdue'],
            ],
        );
    });

    it('reports unreadable files as error nodes and resolvedError', () => {
        const broken = unit('Broken__c');
        assert.deepEqual(
            broken.resolvedError.map((e) => [e.status, (e.value as Node).code]),
            [
                ['added', 'XML_SYNTAX'],
                ['added', 'UNEXPECTED_ROOT'],
            ],
        );
        assert.deepEqual(
            (broken.content as Node).fields.fields.map((f: Node) => [f.status, f.kind]),
            [
                ['removed', 'field'],
                ['added', 'error'],
                ['added', 'error'],
            ],
        );
    });

    it('makes view data with field and dependency statuses', () => {
        const invoice = result.views.metadata.find((o) => o.apiName === 'Invoice__c')!;
        assert.equal(invoice.status, 'changed');
        assert.deepEqual(
            invoice.fields
                .filter((f) => f.status !== 'unchanged')
                .map((f) => [f.apiName, f.status]),
            [
                ['Account__c', 'changed'],
                ['Amount__c', 'changed'],
                ['Approved__c', 'added'],
                ['Status__c', 'changed'],
                ['Note__c', 'removed'],
            ],
        );
        assert.deepEqual(
            result.views.dependency
                .filter((d) => d.status !== 'unchanged' && d.childObjectApiName !== 'User')
                .map((d) => [d.parentObjectApiName, d.status]),
            [
                ['Payment__c', 'added'],
                ['Legacy_Item__c', 'removed'],
            ],
        );
        assert.ok(
            collect(result.views).every((n) =>
                ['added', 'removed', 'changed', 'unchanged'].includes(n.status),
            ),
        );
    });
});

describe('MetadataProcessor', () => {
    let tmp: string;
    before(async () => {
        tmp = await mkdtemp(path.join(os.tmpdir(), 'metadata-processor-'));
    });
    after(async () => {
        await rm(tmp, { recursive: true, force: true });
    });

    it('saves the current objects and diffs the repository against them', async () => {
        const repository = path.join(tmp, 'repository');
        const objects = path.join(repository, 'force-app', 'main', 'default', 'objects');
        const saveRoot = path.join(tmp, 'saved');
        const sample = (side: string) =>
            path.join(
                'docs/examples/metadata/samples',
                side,
                'force-app',
                'main',
                'default',
                'objects',
            );

        await cp(sample('before'), objects, { recursive: true });
        const processor = await MetadataProcessor.create(saveRoot, repository);
        assert.equal(await processor.hasSavedObjects(), false);
        await processor.save();
        assert.equal(await processor.hasSavedObjects(), true);
        assert.ok(processor.getObjectUnitDiffs().every((d) => d.status === 'unchanged'));

        await rm(objects, { recursive: true });
        await cp(sample('after'), objects, { recursive: true });
        await processor.reset();
        assert.deepEqual(
            processor
                .getObjectViews({ isDiff: true })
                .filter((o) => o.status !== 'unchanged')
                .map((o) => [o.apiName, o.status]),
            [
                ['Account', 'changed'],
                ['Broken__c', 'changed'],
                ['Invoice__c', 'changed'],
                ['Invoice_Line__c', 'changed'],
                ['Legacy_Item__c', 'removed'],
                ['Payment__c', 'added'],
            ],
        );

        // Payment__c から 2 段たどると Invoice__c まで (参照される側へたどる)
        assert.deepEqual(
            processor
                .getObjectViews({ isDiff: false, targets: ['Payment__c'], depth: 2 })
                .map((o) => o.apiName),
            ['Invoice__c', 'Payment__c'],
        );
        assert.ok(
            processor
                .getDependencyViews({ isDiff: false, targets: ['Payment__c'], depth: 1 })
                .every((d) => d.parentObjectApiName === 'Payment__c' && d.status === undefined),
        );
    });
});
