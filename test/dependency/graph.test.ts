import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { SIDES, repositoryOf } from '../../docs/examples/paths';
import {
    type DependencyGraph,
    diffDependencies,
    getCycles,
    getDependencies,
    getDependents,
    getDeploymentOrder,
    getImpact,
    getUnused,
    toDot,
    toLevel,
    toMermaid,
    toPackageXml,
} from '../../src/analyzer/processor/dependency/graph';
import { Repository, WorkingTree, analyzeDependencies } from '../../src/analyzer/unit';

// サンプルのリポジトリ (docs/examples/repository) の全種類をまたぐ依存関係の期待値

describe('dependency graph (依存関係のグラフ)', () => {
    let beforeGraph: DependencyGraph;
    let graph: DependencyGraph;

    before(async () => {
        const [b, a] = await Promise.all(
            SIDES.map((side) => Repository.load(new WorkingTree(repositoryOf(side)))),
        );
        beforeGraph = analyzeDependencies(b!);
        graph = analyzeDependencies(a!);
    });

    it('finds everything that uses Invoice__c.Amount__c across types', () => {
        const units = [...getDependents(graph, 'field:Invoice__c.Amount__c').keys()].sort();
        assert.deepEqual(units, [
            'apexPage:InvoicePrint',
            'approvalProcess:Invoice__c.Large_Invoice_Approval',
            'emailTemplate:Invoice_Templates/Invoice_Sent',
            'flexiPage:Invoice_Record_Page',
            'flow:Invoice_Status_Update',
            'layout:Invoice__c-Invoice Detail',
            'layout:Invoice__c-Invoice Layout',
            'permissionSet:Invoice_Manager',
            'permissionSet:Payment_Clerk',
            'quickAction:Invoice__c.Approve',
            'report:Invoice_Reports/Open_Invoices',
            'sharingRules:Invoice__c',
        ]);
        // メンバーの細かさでは、同じオブジェクトの入力規則・項目セットも出る
        const members = [
            ...getDependents(graph, 'field:Invoice__c.Amount__c', { level: 'member' }).keys(),
        ];
        assert.ok(members.includes('validationRule:Invoice__c.Amount_Positive'));
        assert.ok(members.includes('fieldSet:Invoice__c.Summary'));
    });

    it('keeps statement / expression nodes under members', () => {
        const edge = graph.edges.find(
            (e) =>
                e.to === 'object:Account' &&
                e.kind === 'queries' &&
                e.unit.id === 'class_AccountService',
        );
        assert.ok(edge);
        const site = graph.nodes.get(edge.from)!;
        assert.equal(site.level, 'site');
        assert.ok(site.sourceKeys);
        assert.match(toLevel(graph, edge.from, 'member'), /^apexMethod:AccountService\./);
        assert.equal(toLevel(graph, edge.from, 'unit'), 'apexClass:AccountService');
    });

    it('reports references to things that are not in the repository', () => {
        const missing = new Set(graph.findings.map((f) => f.target));
        for (const target of [
            'apexClass:InvoiceController',
            'field:Account.Missing__c',
            'field:Invoice__c.Missing__c',
            'lwc:missingChart',
            'customLabel:BannerMessage',
        ]) {
            assert.ok(missing.has(target), target);
        }
        // 標準のもの・確かめられないものは指摘しない
        assert.ok(!missing.has('field:Account.Name'));
        assert.ok(!missing.has('object:Account'));
        assert.ok(![...missing].some((t) => t.startsWith('apexType:')));
    });

    it('follows dependencies and impact', () => {
        const uses = [...getDependencies(graph, 'apexTrigger:AccountTrigger').keys()];
        assert.ok(uses.includes('apexClass:AccountService'));
        assert.ok(uses.includes('object:Account'));
        const impact = getImpact(graph, ['apexClass:AccountService']);
        assert.equal(impact.get('apexTrigger:AccountTrigger'), 1);
        assert.equal(impact.get('permissionSet:Invoice_Manager'), 1);
        assert.ok(!impact.has('apexClass:AccountService'));
    });

    it('diffs dependencies between before and after', () => {
        const { added, removed } = diffDependencies(beforeGraph, graph);
        assert.ok(added.length > 0 && removed.length > 0);
        // after で消えたオブジェクト (Legacy_Item__c) への依存はない
        assert.ok(!added.some((d) => d.to === 'object:Legacy_Item__c'));
    });

    it('lists unused candidates, cycles and a deployment order', () => {
        const unused = getUnused(graph).map((n) => n.id);
        assert.ok(unused.includes('staticResource:logo'));
        assert.ok(!unused.includes('field:Invoice__c.Amount__c'));
        assert.ok(!unused.includes('apexClass:AccountService'));
        assert.deepEqual(getCycles(graph), []);
        const order = getDeploymentOrder(graph);
        const position = (id: string) => order.findIndex((level) => level.includes(id));
        assert.ok(position('object:Account') < position('apexClass:AccountService'));
        assert.ok(position('apexClass:AccountService') < position('apexTrigger:AccountTrigger'));
    });

    it('writes Mermaid, DOT and package.xml', () => {
        assert.match(toMermaid(graph), /^flowchart LR/);
        assert.match(
            toMermaid(graph),
            /n_apexTrigger_AccountTrigger --> n_apexClass_AccountService/,
        );
        assert.match(toDot(graph), /"apexTrigger:AccountTrigger" -> "apexClass:AccountService"/);
        const xml = toPackageXml(graph, [
            'apexClass:AccountService',
            'apexTrigger:AccountTrigger',
            'field:Invoice__c.Amount__c',
        ]);
        assert.match(xml, /<members>AccountService<\/members>\s*<name>ApexClass<\/name>/);
        assert.match(xml, /<members>Invoice__c.Amount__c<\/members>\s*<name>CustomField<\/name>/);
    });
});
