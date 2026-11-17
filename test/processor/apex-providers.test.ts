import assert from 'node:assert/strict';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import {
    type MetadataSnapshot,
    getApexDataAccess,
    getApexInterface,
    getApexOutline,
    snapshotOf,
} from '../../src/analyzer/report';
import { Repository, WorkingTree } from '../../src/analyzer/unit';

// Apex のドキュメント・理解のための provider (apex.outline / apex.dataAccess)。
// 既定は今の状態のすべて (status なし)、比べるときだけ status と変わったプロパティ。サンプルは docs/examples/repository

const repository = (side: 'before' | 'after') =>
    Repository.load(new WorkingTree(path.resolve('docs/examples/repository', side)));

let beforeSnapshot: MetadataSnapshot;
let afterSnapshot: MetadataSnapshot;

describe('Apex の provider', () => {
    before(async () => {
        beforeSnapshot = snapshotOf(await repository('before'));
        afterSnapshot = snapshotOf(await repository('after'));
    });
    const one = () => ({ after: afterSnapshot });
    const compared = () => ({ before: beforeSnapshot, after: afterSnapshot });

    it('apex.outline: private・protected を含むすべてのメンバー (公開のものだけの apex.interface より多い)', () => {
        const rows = getApexOutline(one(), { classes: ['AccountService'] });
        assert.ok(rows.every((r) => r.status === undefined && r.className === 'AccountService'));
        assert.equal(rows[0]!.memberType, 'class');
        const accesses = new Set(rows.map((r) => r.access));
        assert.ok(accesses.has('private') && accesses.has('protected') && accesses.has('public'));
        const publicRows = getApexInterface(one()).filter((r) => r.className === 'AccountService');
        assert.ok(rows.length > publicRows.length);
    });

    it('apex.outline: トリガーは対象のオブジェクトとイベント。テストのクラスは印を付け、外せる', () => {
        const trigger = getApexOutline(one(), { classes: ['AccountTrigger'] });
        assert.deepEqual(
            trigger.map((r) => [r.memberType, r.type, r.events]),
            [['trigger', 'Account', ['after update', 'before delete']]],
        );
        const all = getApexOutline(one());
        const tests = all.filter((r) => r.isTest);
        assert.ok(tests.length > 0);
        const withoutTests = getApexOutline(one(), { includeTests: false });
        assert.equal(withoutTests.length, all.length - tests.length);
    });

    it('apex.dataAccess: クエリはオブジェクトと読む項目、DML は同じメソッドで代入する項目', () => {
        const rows = getApexDataAccess(one(), { classes: ['AccountService'] });
        const query = rows.find(
            (r) => r.member === 'AccountService.sync' && r.operation === 'select',
        )!;
        assert.equal(query.object, 'Account');
        assert.deepEqual(query.fields, ['Account.Id', 'Account.Name']);
        assert.equal(query.inLoop, false);
        const update = rows.find(
            (r) => r.member === 'AccountService.sync' && r.operation === 'update',
        )!;
        assert.equal(update.object, 'Account');
        assert.deepEqual(update.fields, ['Account.Name']);
        // SOSL は RETURNING のオブジェクトごと
        assert.deepEqual(
            rows
                .filter((r) => r.member === 'AccountService.search' && r.operation === 'search')
                .map((r) => r.object),
            ['Account', 'Contact', 'Lead'],
        );
        // オブジェクトで絞る
        assert.ok(
            getApexDataAccess(one(), { objects: ['Contact'] }).every((r) => r.object === 'Contact'),
        );
        assert.ok(getApexDataAccess(one(), { includeTests: false }).every((r) => !r.inTest));
    });

    it('比べると status と、変わったプロパティの名前を付ける', () => {
        const outline = getApexOutline(compared(), { classes: ['AccountService'] });
        const name = outline.find((r) => r.memberType === 'field' && r.name === 'name')!;
        assert.equal(name.status, 'changed');
        assert.deepEqual(name.changedProperties, ['access']);
        assert.equal(outline.find((r) => r.name === 'loop')!.status, 'removed');
        const access = getApexDataAccess(compared(), { classes: ['AccountService'] });
        const lead = access.find((r) => r.operation === 'search' && r.object === 'Lead')!;
        assert.equal(lead.status, 'added');
    });
});
