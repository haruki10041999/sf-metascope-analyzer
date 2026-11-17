import assert from 'node:assert/strict';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import {
    type MetadataSnapshot,
    getTranslationCoverage,
    getTranslationItems,
    snapshotOf,
} from '../../src/analyzer/report';
import { Repository, WorkingTree } from '../../src/analyzer/unit';

// 翻訳の provider (translation.coverage / translation.items)。既定はすべての言語 (languages で絞る)。
// 比べるときだけ status と古い翻訳 (outdated)。サンプルは docs/examples/repository

const repository = (side: 'before' | 'after') =>
    Repository.load(new WorkingTree(path.resolve('docs/examples/repository', side)));

let beforeSnapshot: MetadataSnapshot;
let afterSnapshot: MetadataSnapshot;

describe('翻訳の provider', () => {
    before(async () => {
        beforeSnapshot = snapshotOf(await repository('before'));
        afterSnapshot = snapshotOf(await repository('after'));
    });
    const one = () => ({ after: afterSnapshot });
    const compared = () => ({ before: beforeSnapshot, after: afterSnapshot });

    it('translation.coverage: 既定はすべての言語。件数と割合', () => {
        const rows = getTranslationCoverage(one());
        assert.ok(rows.every((r) => r.status === undefined));
        assert.deepEqual([...new Set(rows.map((r) => r.language))].sort(), ['en_US', 'ja']);
        const invoice = rows.find((r) => r.object === 'Invoice__c' && r.language === 'ja')!;
        assert.equal(
            invoice.total,
            invoice.translated + invoice.missing + invoice.sameAsSource + invoice.outdated,
        );
        assert.equal(invoice.coverage, Math.round((invoice.translated / invoice.total) * 100));
        assert.ok(
            getTranslationCoverage(one(), { languages: ['ja'] }).every((r) => r.language === 'ja'),
        );
    });

    it('translation.items: 翻訳元・訳・状態。状態で絞れる', () => {
        const rows = getTranslationItems(one(), { objects: ['Invoice__c'], languages: ['ja'] });
        const amount = rows.find((r) => r.kind === 'fieldLabel' && r.name === 'Amount__c')!;
        assert.equal(amount.translationStatus, 'translated');
        assert.equal(amount.translation, '金額');
        assert.equal(
            rows.find((r) => r.kind === 'fieldLabel' && r.name === 'Note__c')!.translationStatus,
            'orphan',
        );
        const missing = getTranslationItems(one(), { statuses: ['missing'] });
        assert.ok(missing.length > 0 && missing.every((r) => r.translationStatus === 'missing'));
        // 古い翻訳は比べるときだけ
        assert.ok(rows.every((r) => r.translationStatus !== 'outdated'));
    });

    it('比べると、古い翻訳と status を付ける', () => {
        const rows = getTranslationItems(compared(), {
            objects: ['Invoice__c'],
            languages: ['ja'],
        });
        assert.ok(rows.some((r) => r.translationStatus === 'outdated'));
        assert.equal(
            rows.find((r) => r.kind === 'fieldLabel' && r.name === 'Approved__c')!.status,
            'added',
        );
        const coverage = getTranslationCoverage(compared());
        assert.equal(coverage.find((r) => r.object === 'Legacy_Item__c')!.status, 'removed');
        const invoice = coverage.find((r) => r.object === 'Invoice__c' && r.language === 'ja')!;
        assert.equal(invoice.status, 'changed');
        assert.ok(invoice.outdated > 0);
    });
});
