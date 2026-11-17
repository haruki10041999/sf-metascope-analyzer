import assert from 'node:assert/strict';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import {
    type MetadataSnapshot,
    getLwcComponents,
    getLwcDetail,
    getLwcWireframe,
    snapshotOf,
} from '../../src/analyzer/report';
import { Repository, WorkingTree } from '../../src/analyzer/unit';

// LWC のドキュメント・理解のための provider (lwc.components / lwc.detail)。
// 既定は今の状態のすべて (status なし)、比べるときだけ status と変わったプロパティ。サンプルは docs/examples/repository

const repository = (side: 'before' | 'after') =>
    Repository.load(new WorkingTree(path.resolve('docs/examples/repository', side)));

let beforeSnapshot: MetadataSnapshot;
let afterSnapshot: MetadataSnapshot;

describe('LWC の provider', () => {
    before(async () => {
        beforeSnapshot = snapshotOf(await repository('before'));
        afterSnapshot = snapshotOf(await repository('after'));
    });
    const one = () => ({ after: afterSnapshot });
    const compared = () => ({ before: beforeSnapshot, after: afterSnapshot });

    it('lwc.components: 公開先・@api・イベント・子コンポーネント・Apex・オブジェクト', () => {
        const rows = getLwcComponents(one());
        assert.ok(rows.every((r) => r.status === undefined));
        const list = rows.find((r) => r.component === 'c/accountList')!;
        assert.equal(list.isExposed, true);
        assert.ok(list.targets.includes('lightning__RecordPage'));
        assert.equal(list.language, 'ts');
        assert.ok(list.apiProperties.includes('recordId'));
        assert.ok(list.childComponents.includes('c/accountRow'));
        assert.ok(list.apexMethods.includes('AccountController.getAccounts'));
        assert.deepEqual(list.objects, ['Account']);
        // 名前でも名前空間つきでも絞れる
        assert.deepEqual(
            getLwcComponents(one(), { components: ['accountRow'] }).map((r) => r.component),
            ['c/accountRow'],
        );
    });

    it('lwc.detail: @wire のアダプター、Apex の使い方、項目、指摘', () => {
        const rows = getLwcDetail(one(), { components: ['c/accountList'] });
        const wired = rows.find((r) => r.category === 'wire' && r.name === 'wiredAccounts')!;
        assert.match(wired.detail!, /^Apex AccountController\.getAccounts/);
        assert.match(wired.detail!, /parentId: \$recordId/);
        assert.equal(
            rows.find((r) => r.category === 'apex' && r.name === 'AccountController.getAccounts')!
                .detail,
            '@wire',
        );
        assert.equal(
            rows.find((r) => r.category === 'apex' && r.name === 'AccountController.deleteAccount')!
                .detail,
            '呼び出し (imperative)',
        );
        assert.ok(rows.some((r) => r.category === 'field' && r.name === 'Account.Name'));
        assert.ok(rows.some((r) => r.category === 'finding' && r.name.includes('c/errorPanel')));
        // 種類で絞る
        assert.ok(
            getLwcDetail(one(), { categories: ['event'] }).every((r) => r.category === 'event'),
        );
    });

    it('lwc.wireframe: テンプレートの骨組み。中で使う子コンポーネントも含め、分岐と繰り返しを持つ', () => {
        const wireframe = getLwcWireframe(one(), { components: ['accountList'] });
        assert.deepEqual(wireframe.roots, ['c/accountList']);
        const names = wireframe.components.map((c) => c.component);
        assert.ok(names.includes('c/accountList') && names.includes('c/accountRow'));
        const list = wireframe.components.find((c) => c.component === 'c/accountList')!;
        const all = JSON.stringify(list.templates);
        assert.match(all, /"type":"if"/);
        assert.match(all, /"type":"for"/);
        assert.match(all, /"module":"lightning\/card"/);
        // depth: 0 なら子コンポーネントは含めない
        assert.deepEqual(
            getLwcWireframe(one(), { components: ['accountList'], depth: 0 }).components.map(
                (c) => c.component,
            ),
            ['c/accountList'],
        );
        // 比べると、コンポーネントごとの status
        const diff = getLwcWireframe(compared());
        assert.equal(diff.components.find((c) => c.component === 'c/newBanner')!.status, 'added');
    });

    it('比べると status と、変わったプロパティの名前を付ける', () => {
        const components = getLwcComponents(compared());
        const list = components.find((r) => r.component === 'c/accountList')!;
        assert.equal(list.status, 'changed');
        assert.ok(list.changedProperties?.includes('apiProperties'));
        assert.equal(components.find((r) => r.component === 'c/newBanner')!.status, 'added');
        assert.equal(components.find((r) => r.component === 'c/oldBanner')!.status, 'removed');
        const detail = getLwcDetail(compared(), { components: ['accountList'] });
        assert.equal(
            detail.find((r) => r.category === 'property' && r.name === 'industry')!.status,
            'added',
        );
        assert.equal(
            detail.find((r) => r.category === 'wire' && r.name === 'wiredAccounts')!.status,
            'changed',
        );
    });
});
