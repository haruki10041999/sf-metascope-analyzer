import assert from 'node:assert/strict';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import { ApexParser } from '../../src/analyzer/parser/Apex/parser';
import { LwcParser } from '../../src/analyzer/parser/Lwc/parser';
import {
    CustomLabelsParser,
    FlexiPageParser,
    FlowParser,
    LayoutParser,
    MutingPermissionSetParser,
    PermissionSetGroupParser,
    PermissionSetParser,
    ProfileParser,
} from '../../src/analyzer/parser/Metadata';
import { MetadataParser } from '../../src/analyzer/parser/Metadata/parser';
import {
    REPORT_PROVIDERS,
    getFlexiPageDetails,
    getFlowDiagrams,
    getLayoutDetails,
    getMetadataFindings,
    getObjectAccessMatrix,
    getPermissionDiffs,
    type MetadataSnapshot,
    type ReportInput,
} from '../../src/analyzer/report';

// レポートの data provider (docs/report-components-plan.md 3.2 章)。サンプルは docs/examples/metadata/samples

const root = (side: 'before' | 'after') =>
    path.resolve('docs/examples/metadata/samples', side, 'force-app/main/default');

const snapshot = async (side: 'before' | 'after'): Promise<MetadataSnapshot> => ({
    permissionSets: await PermissionSetParser.parseAll(root(side)),
    mutingPermissionSets: await MutingPermissionSetParser.parseAll(root(side)),
    profiles: await ProfileParser.parseAll(root(side)),
    permissionSetGroups: await PermissionSetGroupParser.parseAll(root(side)),
    customLabels: await CustomLabelsParser.parseAll(root(side)),
    flows: await FlowParser.parseAll(root(side)),
    layouts: await LayoutParser.parseAll(root(side)),
    flexiPages: await FlexiPageParser.parseAll(root(side)),
    objects: await MetadataParser.parseObjects(path.join(root(side), 'objects')),
    apex: await ApexParser.parseApexUnits(path.resolve('docs/examples/apex/samples/diff', side)),
    lwc: await LwcParser.parseLwcBundles(
        path.resolve('docs/examples/lwc/samples/bundles/force-app/main/default/lwc'),
    ),
});

let input: ReportInput;

describe('レポートの data provider', () => {
    before(async () => {
        input = { before: await snapshot('before'), after: await snapshot('after') };
    });

    it('すべての provider が before → after で動き、各行は status を持つ', () => {
        for (const [name, provider] of Object.entries(REPORT_PROVIDERS)) {
            const data = (provider as (input: ReportInput) => unknown)(input);
            assert.ok(data !== undefined, name);
        }
        assert.ok(getPermissionDiffs(input).every((row) => row.status !== undefined));
    });

    it('before を渡さなければ status を持たない (1 時点のレポート)', () => {
        const rows = getPermissionDiffs({ after: input.after });
        assert.ok(rows.length > 0);
        assert.ok(rows.every((row) => row.status === undefined));
    });

    it('permission.diffs: 権限の行ごとに、変わった値だけを持つ', () => {
        const amount = getPermissionDiffs(input).find(
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
        const matrix = getObjectAccessMatrix(input, { onlyChanged: true });
        assert.ok(matrix.rows.includes('Payment__c'));
        assert.ok(!matrix.rows.includes('Account'));
        assert.equal(matrix.cells.Payment__c!['permissionSet:Invoice_Manager']!.status, 'added');
    });

    it('flow.diagram: 位置だけの変更は unchanged、つなぎ替えは edges の added / removed', () => {
        const [diagram] = getFlowDiagrams(input, ['Invoice_Status_Update']);
        const status = (id: string) => diagram!.nodes.find((n) => n.id === id)!.status;
        assert.equal(status('Notify'), 'unchanged');
        assert.equal(status('Orphan'), 'added');
        assert.deepEqual(
            diagram!.edges.filter((e) => e.status === 'removed').map((e) => `${e.from}->${e.to}`),
            ['Notify->Set_Status'],
        );
    });

    it('layout.detail / flexiPage.detail: 移動は変更前の位置付き', () => {
        const layout = getLayoutDetails(input, ['Invoice__c-Invoice Layout'])[0]!;
        const status = layout.sections
            .find((s) => s.label === 'Approval')!
            .items.find((i) => i.field === 'Status__c')!;
        assert.deepEqual(status.movedFrom, { section: 'Information', column: 2, row: 1 });
        const page = getFlexiPageDetails(input)[0]!;
        const list = page.regions
            .find((r) => r.name === 'sidebar')!
            .items.find((i) => i.identifier === 'c_accountList')!;
        assert.equal(list.movedFrom, 'main');
        assert.equal(list.status, 'changed');
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
