import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { loadSampleInput } from '../../docs/examples/report/scripts/run-report';
import {
    type MetadataPropertyRow,
    type MetadataUnitRow,
    type ReportInput,
    getMetadataProperties,
    getMetadataTypes,
    getMetadataUnits,
    runReportProvider,
} from '../../src/analyzer/report';
import { UNIT_TYPES } from '../../src/analyzer/unit';

// すべての種類の土台の provider (metadata.types / metadata.units / metadata.properties。docs/todo.md 2.1)。
// サンプルは docs/examples/repository

describe('すべての種類の土台の provider', () => {
    let input: ReportInput;
    before(async () => {
        input = await loadSampleInput();
    });
    const one = () => ({ after: input.after });

    it('metadata.types: サンプルにある種類ごとの数 (1 時点では追加・削除の数を持たない)', () => {
        const rows = getMetadataTypes(one());
        const known = new Set(UNIT_TYPES.map((t) => t.type));
        assert.ok(rows.length > 40);
        assert.ok(rows.every((r) => known.has(r.unitType) && r.count > 0 && r.added === undefined));
        assert.equal(rows.find((r) => r.unitType === 'object')!.count, 7);
        assert.ok(rows.find((r) => r.unitType === 'apexClass')!.withErrors > 0);
        // 比べると、追加・削除の数
        const compared = getMetadataTypes(input);
        assert.ok(compared.some((r) => (r.added ?? 0) > 0));
    });

    it('metadata.units: すべての種類の単位。種類・名前で絞れ、ファイルはリポジトリからの相対パス', () => {
        const rows = getMetadataUnits(one(), { types: ['customTab', 'role'] });
        assert.ok(rows.length > 0 && rows.every((r) => ['customTab', 'role'].includes(r.unitType)));
        const tab = rows.find((r) => r.name === 'Account_List')!;
        assert.equal(tab.label, 'Account List');
        assert.match(tab.filePath!, /^force-app\//);
        assert.ok(rows.every((r) => r.status === undefined));
        const compared = getMetadataUnits(input, { types: ['apexClass'] });
        assert.equal(
            compared.find((r: MetadataUnitRow) => r.name === 'NewHelper')!.status,
            'added',
        );
    });

    it('metadata.properties: 場所 → 値。配列の要素は名前で、数式・条件は文字列', () => {
        const rows = getMetadataProperties(one(), { types: ['sharingRules', 'role', 'apexClass'] });
        const value = (name: string, path: string) =>
            rows.find((r: MetadataPropertyRow) => r.name === name && r.path === path)?.value;
        assert.equal(
            value('Invoice__c', 'sharingCriteriaRules[Large_Invoices].accessLevel'),
            'Edit',
        );
        assert.equal(value('Sales_Manager', 'parentRole'), 'CEO');
        // Apex は -meta.xml の値だけ
        assert.equal(value('AccountService', 'meta.meta.apiVersion'), '61.0');
        assert.ok(
            rows.filter((r) => r.unitType === 'apexClass').every((r) => r.path.startsWith('meta')),
        );
        // 条件の行は「左 演算子 右」
        assert.ok(
            rows.some(
                (r) =>
                    r.path.includes('criteriaItems') &&
                    /^Amount__c greaterThan /.test(String(r.value)),
            ),
        );
        // paths で絞る
        assert.ok(
            getMetadataProperties(one(), { types: ['role'], paths: ['parentRole'] }).every(
                (r) => r.path === 'parentRole',
            ),
        );
    });

    it('metadata.properties: 比べると、変わった値と前の値', () => {
        const rows = getMetadataProperties(input, {
            types: ['apexClass'],
            names: ['AccountService'],
        });
        const version = rows.find((r) => r.path === 'meta.meta.apiVersion')!;
        assert.equal(version.status, 'changed');
        assert.equal(version.before, '59.0');
        assert.equal(version.value, '61.0');
    });

    it('機密になりうる値は伏せる (runReportProvider。指定ログイン情報の URL・リモートサイトの URL など)', () => {
        const rows = runReportProvider('metadata.properties', one(), {
            types: ['namedCredential', 'remoteSiteSetting', 'externalCredential'],
        }) as MetadataPropertyRow[];
        const json = JSON.stringify(rows);
        assert.ok(!/https?:\/\//.test(json), 'URL が出ている');
        assert.ok(rows.some((r) => r.value === '***'));
        // 伏せないとき (mask: false) は URL がある (テストが正しく伏せたことを確かめている)
        const raw = runReportProvider(
            'metadata.properties',
            one(),
            { types: ['namedCredential'] },
            { mask: false },
        ) as MetadataPropertyRow[];
        assert.ok(/https?:\/\//.test(JSON.stringify(raw)));
    });
});
