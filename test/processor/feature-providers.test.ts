import assert from 'node:assert/strict';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import { getFeatureScope } from '../../src/analyzer/report';
import { Repository, WorkingTree } from '../../src/analyzer/unit';
import { resolveReport } from '../../src/builder/reportBuilder';
import { featureOverviewTemplate } from '../../src/report/domainTemplates';

// 機能のまとまり (feature.scope と雛形 feature_overview。docs/todo.md 2.5)。サンプルは docs/examples/repository

let after: Repository;

describe('機能のまとまり', () => {
    before(async () => {
        after = await Repository.load(
            new WorkingTree(path.resolve('docs/examples/repository', 'after')),
        );
    });

    it('feature.scope: 起点から両方向に 1 段。起点との関係・段数・ファイル', () => {
        const rows = getFeatureScope({ after }, { targets: ['apexClass:AccountService'] });
        const byId = new Map(rows.map((r) => [r.nodeId, r]));
        assert.equal(byId.get('apexClass:AccountService')!.relation, 'target');
        assert.equal(byId.get('apexClass:AccountService')!.depth, 0);
        assert.equal(byId.get('object:Account')!.relation, 'uses');
        assert.equal(byId.get('apexTrigger:AccountTrigger')!.relation, 'usedBy');
        assert.match(byId.get('apexTrigger:AccountTrigger')!.filePath!, /AccountTrigger\.trigger$/);
        assert.equal(rows[0]!.nodeId, 'apexClass:AccountService');
    });

    it('feature.scope: 項目の起点は単位にまとめ、向き・除く種類・フォルダのある種類の名前', () => {
        const uses = getFeatureScope(
            { after },
            { targets: ['field:Invoice__c.Amount__c'], direction: 'dependencies' },
        );
        assert.ok(uses.every((r) => r.relation === 'target' || r.relation === 'uses'));
        assert.equal(uses.find((r) => r.relation === 'target')!.nodeId, 'object:Invoice__c');
        const rows = getFeatureScope(
            { after },
            { targets: ['object:Invoice__c'], excludeTypes: ['profile'] },
        );
        assert.ok(rows.every((r) => r.unitType !== 'profile'));
        assert.ok(rows.some((r) => r.name === 'Invoice_Templates.Invoice_Sent'));
        assert.deepEqual(getFeatureScope({ after }, { targets: ['object:Nothing__c'] }), []);
    });

    it('feature_overview: カスタムオブジェクトごとに 1 ページ (起点は指定しない)。範囲にある種類だけ中身を出す', () => {
        const resolved = resolveReport(featureOverviewTemplate(), { after });
        assert.ok(resolved.ok, JSON.stringify(!resolved.ok && resolved.issues));
        const titles = resolved.pages!.map((page) => page.report.title);
        assert.ok(titles.includes('Invoice'));
        assert.ok(!titles.includes('Account'));
        const invoice = resolved.pages!.find((page) => page.report.title === 'Invoice')!;
        const types = Object.values(invoice.report.spec.elements).map((e) => e.type);
        assert.ok(types.includes('FlowDiagram'));
        assert.ok(types.includes('LayoutView'));
    });
});
