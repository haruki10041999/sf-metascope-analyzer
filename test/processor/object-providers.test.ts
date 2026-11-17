import assert from 'node:assert/strict';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import {
    type MetadataSnapshot,
    getObjectDiagram,
    getObjectFields,
    getObjectList,
    getObjectPicklists,
    getObjectRecordTypePicklists,
    getObjectValidationRules,
    snapshotOf,
} from '../../src/analyzer/report';
import { Repository, WorkingTree } from '../../src/analyzer/unit';
import type { CustomObjectJson } from '../../src/analyzer/types';

// オブジェクトの provider (object.*)。既定は今の状態のすべて (status なし)、比べるときだけ status と変わったプロパティ。
// サンプルは docs/examples/repository

const repository = (side: 'before' | 'after') =>
    Repository.load(new WorkingTree(path.resolve('docs/examples/repository', side)));

let beforeSnapshot: MetadataSnapshot;
let afterSnapshot: MetadataSnapshot;

describe('オブジェクトの provider', () => {
    before(async () => {
        beforeSnapshot = snapshotOf(await repository('before'));
        afterSnapshot = snapshotOf(await repository('after'));
    });
    const one = () => ({ after: afterSnapshot });
    const compared = () => ({ before: beforeSnapshot, after: afterSnapshot });

    it('object.list: 1 時点ではすべてのオブジェクトを API 名の順に、status なしで返す', () => {
        const rows = getObjectList(one());
        assert.deepEqual(
            rows.map((r) => r.object),
            [...rows.map((r) => r.object)].sort((a, b) => a.localeCompare(b)),
        );
        assert.ok(rows.every((r) => r.status === undefined));
        const invoice = rows.find((r) => r.object === 'Invoice__c')!;
        assert.equal(invoice.objectType, 'custom');
        assert.ok(invoice.fieldCount > 0);
        assert.deepEqual(
            getObjectList(one(), { objects: ['Account'] }).map((r) => r.object),
            ['Account'],
        );
    });

    it('object.fields: 暗黙の標準項目を先に含み、数式・参照先を文字列で返す', () => {
        const rows = getObjectFields(one(), { objects: ['Invoice__c'] });
        assert.equal(rows[0]!.field, 'Id');
        assert.equal(rows[0]!.origin, 'implicit');
        assert.equal(rows.find((r) => r.field === 'CreatedById')!.referenceTo, 'User');
        const account = rows.find((r) => r.field === 'Account__c')!;
        assert.equal(account.origin, 'metadata');
        assert.equal(account.type, 'Lookup');
        assert.equal(account.referenceTo, 'Account');
        assert.ok(
            getObjectFields(one(), { objects: ['Invoice__c'], includeImplicit: false }).every(
                (r) => r.origin === 'metadata',
            ),
        );
    });

    it('object.fields: 比べると status と、変わったプロパティの名前を付ける', () => {
        const rows = getObjectFields(compared());
        const amount = rows.find((r) => r.object === 'Invoice__c' && r.field === 'Amount__c')!;
        assert.equal(amount.status, 'changed');
        assert.ok(amount.changedProperties?.includes('precision'));
        assert.equal(
            rows.find((r) => r.object === 'Invoice__c' && r.field === 'Approved__c')!.status,
            'added',
        );
        assert.equal(
            rows.find((r) => r.object === 'Invoice__c' && r.field === 'Note__c')!.status,
            'removed',
        );
        // 追加されたオブジェクトは、暗黙の標準項目も追加
        assert.equal(
            rows.find((r) => r.object === 'Payment__c' && r.field === 'Id')!.status,
            'added',
        );
    });

    it('object.fields: 比べると、選択リスト値の並び順が変わったことを印にする', () => {
        // Account.Tier__c の値の並びを逆にした before を作る
        const objects = structuredClone(afterSnapshot.objects!);
        const account = objects.find(
            (r) => (r.result.base as CustomObjectJson | null)?.apiName === 'Account',
        )!.result.base as CustomObjectJson;
        const tier = account.fields!.find((f) => f.apiName === 'Tier__c')!;
        tier.valueSet!.values!.reverse();
        tier.sourceKeys = { ...tier.sourceKeys, objectKey: 'reordered' };
        const rows = getObjectFields({
            before: { ...afterSnapshot, objects },
            after: afterSnapshot,
        });
        const row = rows.find((r) => r.object === 'Account' && r.field === 'Tier__c')!;
        assert.equal(row.status, 'changed');
        assert.equal(row.picklistOrderChanged, true);
        // 1 時点では付けない
        assert.ok(getObjectFields(one()).every((r) => r.picklistOrderChanged === undefined));
    });

    it('object.picklists: 選択リスト値を定義の順に返す', () => {
        const rows = getObjectPicklists(one(), { objects: ['Account'], fields: ['Tier__c'] });
        assert.ok(rows.length > 1);
        assert.deepEqual(
            rows.map((r) => r.order),
            rows.map((_, i) => i + 1),
        );
        assert.ok(rows.every((r) => r.field === 'Tier__c' && r.value !== undefined));
    });

    it('object.validationRules: エラー条件の数式を文字列で返す', () => {
        const rule = getObjectValidationRules(one(), { objects: ['Invoice__c'] }).find(
            (r) => r.rule === 'Amount_Positive',
        )!;
        assert.equal(rule.condition, 'Amount__c <= 0');
        assert.equal(rule.errorDisplayField, 'Amount__c');
    });

    it('object.recordTypePicklists: レコードタイプごとの選べる値と既定値', () => {
        const rows = getObjectRecordTypePicklists(one(), { objects: ['Invoice__c'] });
        const status = rows.find((r) => r.recordType === 'Standard' && r.picklist === 'Status__c')!;
        assert.ok(status.values.length > 0);
        assert.equal(status.defaultValue, status.values[0]);
    });

    it('object.diagram: 参照・主従関係と、リポジトリにない参照先', () => {
        const diagram = getObjectDiagram(one());
        assert.ok(
            diagram.relations.some(
                (r) =>
                    r.from === 'Invoice_Line__c' &&
                    r.to === 'Invoice__c' &&
                    r.type === 'MasterDetail',
            ),
        );
        const product = diagram.objects.find((o) => o.name === 'Product2');
        assert.equal(product?.external, true);
        // 起点から 1 段 (両方向)
        const payment = getObjectDiagram(one(), { objects: ['Payment__c'] });
        assert.deepEqual(payment.objects.map((o) => o.name).sort(), ['Invoice__c', 'Payment__c']);
        assert.ok(payment.relations.every((r) => r.from === 'Payment__c'));
        // 比べると、追加されたオブジェクトに status
        const diff = getObjectDiagram(compared());
        assert.equal(diff.objects.find((o) => o.name === 'Payment__c')!.status, 'added');
    });
});
