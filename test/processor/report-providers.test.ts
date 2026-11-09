import assert from 'node:assert/strict';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import {
    REPORT_PROVIDERS,
    getFlexiPageDetails,
    getFlowDiagrams,
    getLayoutDetails,
    getMetadataFindings,
    getObjectAccessMatrix,
    getPermissionDiffs,
    type ReportInput,
    snapshotInputOf,
} from '../../src/analyzer/report';
import { Repository, WorkingTree } from '../../src/analyzer/unit';

// レポートの data provider (docs/report-components-plan.md 3.2 章)。サンプルは docs/examples/repository

const repository = (side: 'before' | 'after') =>
    Repository.load(new WorkingTree(path.resolve('docs/examples/repository', side)));

let input: ReportInput;

describe('レポートの data provider', () => {
    before(async () => {
        input = { before: await repository('before'), after: await repository('after') };
    });

    it('すべての provider が before → after で動き、各行は status を持つ', () => {
        for (const [name, provider] of Object.entries(REPORT_PROVIDERS)) {
            const data = (provider as (input: ReportInput) => unknown)(input);
            assert.ok(data !== undefined, name);
        }
        assert.ok(
            getPermissionDiffs(snapshotInputOf(input)).every((row) => row.status !== undefined),
        );
    });

    it('dependency.*: 依存関係のグラフから、逆引き・変更の影響・ない参照・図を出す', () => {
        const dependents = REPORT_PROVIDERS['dependency.dependents'](input, {
            target: 'field:Invoice__c.Amount__c',
        });
        assert.ok(dependents.some((row) => row.id === 'permissionSet:Invoice_Manager'));
        assert.ok(dependents.some((row) => row.id === 'layout:Invoice__c-Invoice Layout'));
        const impact = REPORT_PROVIDERS['dependency.impact'](input);
        assert.ok(impact.changed.some((row) => row.id === 'object:Invoice__c'));
        assert.ok(impact.changed.every((row) => row.status !== 'unchanged'));
        const missing = REPORT_PROVIDERS['dependency.missing'](input);
        assert.ok(missing.some((row) => row.target === 'field:Account.Missing__c'));
        const changes = REPORT_PROVIDERS['dependency.changes'](input);
        assert.ok(changes.some((row) => row.status === 'added'));
        const diagram = REPORT_PROVIDERS['dependency.graph'](input, {
            targets: ['apexClass:AccountService'],
        });
        assert.match(diagram.text, /n_apexTrigger_AccountTrigger --> n_apexClass_AccountService/);
    });

    it('before を渡さなければ status を持たない (1 時点のレポート)', () => {
        const rows = getPermissionDiffs(snapshotInputOf({ after: input.after }));
        assert.ok(rows.length > 0);
        assert.ok(rows.every((row) => row.status === undefined));
    });

    it('permission.diffs: 権限の行ごとに、変わった値だけを持つ', () => {
        const amount = getPermissionDiffs(snapshotInputOf(input)).find(
            (row) => row.holder.name === 'Invoice_Manager' && row.target === 'Invoice__c.Amount__c',
        )!;
        assert.equal(amount.status, 'changed');
        assert.deepEqual(amount.changes, [{ name: 'editable', before: false, after: true }]);
        assert.ok(amount.sourceKeys);
        assert.equal(
            amount.filePath!.split(path.sep).pop(),
            'Invoice_Manager.permissionset-meta.xml',
        );
    });

    it('permission.objectAccess: 変わったセルのある行に絞れる', () => {
        const matrix = getObjectAccessMatrix(snapshotInputOf(input), { onlyChanged: true });
        assert.ok(matrix.rows.includes('Payment__c'));
        assert.ok(!matrix.rows.includes('Account'));
        assert.equal(matrix.cells.Payment__c!['permissionSet:Invoice_Manager']!.status, 'added');
    });

    it('flow.diagram: 位置だけの変更は unchanged、つなぎ替えは edges の added / removed', () => {
        const [diagram] = getFlowDiagrams(snapshotInputOf(input), ['Invoice_Status_Update']);
        const status = (id: string) => diagram!.nodes.find((n) => n.id === id)!.status;
        assert.equal(status('Notify'), 'unchanged');
        assert.equal(status('Orphan'), 'added');
        assert.deepEqual(
            diagram!.edges.filter((e) => e.status === 'removed').map((e) => `${e.from}->${e.to}`),
            ['Notify->Set_Status'],
        );
    });

    it('layout.detail / flexiPage.detail: 移動は変更前の位置付き', () => {
        const layout = getLayoutDetails(snapshotInputOf(input), ['Invoice__c-Invoice Layout'])[0]!;
        const status = layout.sections
            .find((s) => s.label === 'Approval')!
            .items.find((i) => i.field === 'Status__c')!;
        assert.deepEqual(status.movedFrom, { section: 'Information', column: 2, row: 1 });
        const page = getFlexiPageDetails(snapshotInputOf(input))[0]!;
        const list = page.regions
            .find((r) => r.name === 'sidebar')!
            .items.find((i) => i.identifier === 'c_accountList')!;
        assert.equal(list.movedFrom, 'main');
        assert.equal(list.status, 'changed');
    });

    it('crossRef.* と metadata.findings の参照は依存関係のグラフから作り、指摘は重ならない', () => {
        const findings = getMetadataFindings({ after: input.after });
        const missing = findings.filter((f) => f.code === 'UNKNOWN_FIELD');
        assert.ok(missing.some((f) => f.target === 'Account.Missing__c'));
        // ない参照先は source: reference だけが出す (レイアウト・権限の解析は出さない)
        assert.ok(missing.every((f) => f.source === 'reference'));
        const references = REPORT_PROVIDERS['crossRef.references']({ after: input.after });
        const amount = references.find((r) => r.target === 'Invoice__c.Amount__c')!;
        assert.ok(amount.usedBy.some((u) => u.from === 'permissionSet_Invoice_Manager'));
        assert.ok(amount.usedBy.every((u) => u.filePath !== ''));
        const labels = REPORT_PROVIDERS['crossRef.labels']({ after: input.after });
        // before の accountList (LWC) は AccountListTitle を使う
        const beforeLabels = REPORT_PROVIDERS['crossRef.labels']({ after: input.before! });
        const title = beforeLabels.find((l) => l.name === 'AccountListTitle')!;
        assert.ok(title.usages.some((u) => u.origin === 'lwc' && u.unit === 'accountList'));
        assert.ok(labels.some((l) => l.usages.some((u) => u.origin === 'flow')));
        assert.ok(findings.some((f) => f.source === 'label' && f.code === 'UNUSED_CUSTOM_LABEL'));
    });

    it('metadata.findings: 新しく出た指摘は added', () => {
        const findings = getMetadataFindings(input);
        const added = findings
            .filter((f) => f.status === 'added')
            .map((f) => `${f.source}:${f.code}:${f.target}`);
        assert.ok(added.includes('flow:UNREACHABLE_ELEMENT:Orphan'));
        assert.ok(added.includes('flexiPage:LWC_NOT_EXPOSED:accountRow'));
    });
});
