import assert from 'node:assert/strict';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import {
    PROVIDER_DEFINITIONS,
    type ProviderDefinition,
    REPORT_PROVIDERS,
    type ReportProviderName,
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

    it('すべての provider が before → after で動き、出力が登録表の出力のスキーマに合う', () => {
        for (const [name, definition] of Object.entries(PROVIDER_DEFINITIONS)) {
            const def = definition as ProviderDefinition;
            const provider = REPORT_PROVIDERS[name as ReportProviderName] as (
                input: ReportInput,
                args?: unknown,
            ) => unknown;
            // 必須の引数がある provider は、登録表の例の引数で呼ぶ
            for (const target of [input, { after: input.after }]) {
                const data = provider(target, def.example);
                const parsed = def.output.safeParse(data);
                assert.ok(
                    parsed.success,
                    `${name}: ${parsed.success ? '' : JSON.stringify(parsed.error.issues.slice(0, 3))}`,
                );
                // スキーマにないキーがない (zod は知らないキーを捨てるので、捨てたものがないかを比べる)
                assert.deepEqual(parsed.data, JSON.parse(JSON.stringify(data)), name);
            }
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

    it('flow.interface: Flow の入出力の変化を、2 つの時点の解析の結果から出す (意味の差分)', () => {
        const rows = REPORT_PROVIDERS['flow.interface'](input, { onlyChanged: true });
        assert.deepEqual(
            rows.map((row) => [row.flow, row.variable, row.direction, row.status]),
            [['Invoice_Status_Update', 'errorMessage', 'output', 'added']],
        );
        // 1 時点なら入出力の一覧 (status なし)
        const current = REPORT_PROVIDERS['flow.interface']({ after: input.after });
        assert.ok(current.some((row) => row.variable === 'errorMessage' && !row.status));
    });

    it('apex.interface: 外から使えるメンバーの追加・削除・型の変化 (意味の差分)', () => {
        const rows = REPORT_PROVIDERS['apex.interface'](input, { onlyChanged: true });
        const show = (row: (typeof rows)[number]) =>
            `${row.status} ${row.owner}#${row.memberType}:${row.name}(${(row.params ?? []).join(',')})`;
        const shown = rows.map(show);
        assert.ok(shown.includes('removed AccountService#method:loop()'), shown.join('\n'));
        assert.ok(shown.includes('added AccountService#method:calc(Decimal,Decimal)'));
        assert.ok(shown.includes('added NewHelper#class:NewHelper()'));
        assert.ok(shown.includes('removed OldHelper#method:run()'));
        // 戻り値の型が変わったメソッドは changed (変わったものの名前を持つ)
        const count = rows.find((r) => r.owner === 'AccountService.Handler' && r.name === 'count')!;
        assert.equal(count.status, 'changed');
        assert.deepEqual(count.changedProperties, ['type']);
        assert.equal(count.type, 'Long');
        // テストのクラス (@isTest) は外から使うものではないので出さない
        assert.ok(
            !REPORT_PROVIDERS['apex.interface']({ after: input.after }).some(
                (r) => r.className === 'ParserTest',
            ),
        );
    });

    it('lwc.interface: @api・イベント・slot の追加・削除 (意味の差分)', () => {
        const rows = REPORT_PROVIDERS['lwc.interface'](input, { onlyChanged: true });
        assert.deepEqual(
            rows
                .filter((r) => r.component === 'c/accountList')
                .map((r) => [r.status, r.memberType, r.name]),
            [
                ['added', 'property', 'industry'],
                ['added', 'event', 'accountsaved'],
            ],
        );
        // 1 時点なら一覧 (型は TS の型の表示、slot は名前)
        const current = REPORT_PROVIDERS['lwc.interface']({ after: input.after });
        const maxRows = current.find(
            (r) => r.component === 'c/accountList' && r.name === 'maxRows',
        )!;
        assert.equal(maxRows.type, 'number');
        assert.equal(maxRows.status, undefined);
        assert.ok(current.some((r) => r.memberType === 'slot' && r.name === 'footer'));
        assert.ok(current.some((r) => r.memberType === 'method' && r.name === 'refresh'));
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
