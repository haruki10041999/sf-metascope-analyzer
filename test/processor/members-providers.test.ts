import assert from 'node:assert/strict';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import {
    type MetadataSnapshot,
    getFlowElements,
    getLabelDefinitions,
    getObjectMembers,
    snapshotOf,
} from '../../src/analyzer/report';
import { Repository, WorkingTree } from '../../src/analyzer/unit';

// 宣言単位の provider (object.members / flow.elements / label.definitions。docs/todo.md 2.2)。
// サンプルは docs/examples/repository

const repository = (side: 'before' | 'after') =>
    Repository.load(new WorkingTree(path.resolve('docs/examples/repository', side)));

let beforeSnapshot: MetadataSnapshot;
let afterSnapshot: MetadataSnapshot;

describe('宣言単位の provider', () => {
    before(async () => {
        beforeSnapshot = snapshotOf(await repository('before'));
        afterSnapshot = snapshotOf(await repository('after'));
    });
    const one = () => ({ after: afterSnapshot });
    const compared = () => ({ before: beforeSnapshot, after: afterSnapshot });

    it('object.members: オブジェクトの子を 1 行 1 つ。中身は「場所 = 値」で、数式は文字列', () => {
        const rows = getObjectMembers(one(), { objects: ['Invoice__c'] });
        assert.ok(rows.every((r) => r.status === undefined && r.object === 'Invoice__c'));
        const types = new Set(rows.map((r) => r.memberType));
        for (const type of [
            'recordType',
            'fieldSet',
            'webLink',
            'sharingReason',
            'actionOverride',
            'searchLayout',
        ]) {
            assert.ok(types.has(type as never), type);
        }
        const link = rows.find((r) => r.memberType === 'webLink' && r.name === 'Send_Invoice')!;
        assert.equal(link.label, 'Send Invoice');
        assert.ok(
            link.details.includes('url = /lightning/cmp/c__sendInvoice?c__id={!Invoice__c.Id}'),
        );
        assert.deepEqual(
            getObjectMembers(one(), { objects: ['Invoice__c'], memberTypes: ['fieldSet'] }).map(
                (r) => r.name,
            ),
            ['Summary'],
        );
    });

    it('flow.elements: 要素の中身 (レコードの操作の対象・条件・値)。Flow の値は 1 つにまとめ、参照は {!x}', () => {
        const rows = getFlowElements(one());
        const lookup = rows.find((r) => r.element === 'Get_Account')!;
        assert.equal(lookup.kind, 'flowRecordLookup');
        assert.equal(lookup.object, 'Account');
        assert.ok(lookup.details.includes('properties.filters = Tier__c EqualTo Gold'));
        const notify = rows.find((r) => r.element === 'Notify')!;
        assert.ok(
            notify.details.includes('properties.inputParameters[invoiceId].value = {!$Record.Id}'),
        );
        assert.ok(
            getFlowElements(one(), { kinds: ['flowDecision'] }).every(
                (r) => r.kind === 'flowDecision',
            ),
        );
    });

    it('比べると status と、増えた・変わった中身 (changedDetails)', () => {
        const rows = getFlowElements(compared());
        const decision = rows.find((r) => r.element === 'Check_Amount')!;
        assert.equal(decision.status, 'changed');
        assert.ok(decision.changedDetails!.some((d) => d.startsWith('rules[Medium]')));
        assert.equal(rows.find((r) => r.element === 'Get_Account')!.status, 'added');
        const members = getObjectMembers(compared(), { objects: ['Invoice__c'] });
        assert.equal(members.find((r) => r.memberType === 'webLink')!.status, 'changed');
    });

    it('label.definitions: 値・言語・分類と、組織の翻訳にある訳', () => {
        const rows = getLabelDefinitions(one());
        const title = rows.find((r) => r.label === 'AccountListTitle')!;
        assert.equal(title.value, '取引先の一覧');
        assert.deepEqual(title.categories, ['account', 'lwc', 'list']);
        assert.deepEqual(title.translations, ['ja: 取引先の一覧']);
        assert.deepEqual(
            getLabelDefinitions(one(), { categories: ['lwc'] }).map((r) => r.label),
            ['AccountListTitle'],
        );
    });
});
