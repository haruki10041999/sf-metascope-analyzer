import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { repositoryOf } from '../../docs/examples/paths';
import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import type { LwcBundleParseResult } from '../../src/analyzer/parser/Lwc/parser';
import {
    ExternalCredentialParser,
    LightningMessageChannelParser,
    NamedCredentialParser,
    ReportTypeParser,
} from '../../src/analyzer/parser/Metadata';
import type { MetadataFileParseResult } from '../../src/analyzer/parser/Metadata/folder';
import { analyzeMetadataRefs } from '../../src/analyzer/processor/Metadata/refs';
import { getApexDependencies } from '../../src/analyzer/processor/dependency/apex';
import { getFormulaReferences } from '../../src/analyzer/processor/dependency/formula';
import {
    type GraphUnit,
    buildDependencyGraph,
} from '../../src/analyzer/processor/dependency/graph';
import type { UnitReference } from '../../src/analyzer/processor/dependency/types';
import {
    getLwcDependencies,
    getUnitDependencies,
} from '../../src/analyzer/processor/dependency/units';

// 参照と定義の種類・名前の突き合わせ (docs/json-gaps.md 5 章の 1〜3)。グラフに小さな入力を直接渡して確かめる

const defUnit = (type: string, defType: string, name: string): GraphUnit => ({
    type,
    id: `${type}_${name}`,
    dependencies: { definitions: [{ defType, name }], references: [] },
});

const refUnit = (
    type: string,
    id: string,
    references: Omit<UnitReference, 'kind' | 'from'>[],
): GraphUnit => ({
    type,
    id,
    dependencies: {
        definitions: [{ defType: type, name: id }],
        references: references.map((r) => ({ ...r, kind: 'uses', from: {} })),
    },
});

describe('dependency graph targets (参照と定義の突き合わせ)', () => {
    it('resolves c:<name> from Aura / FlexiPage / Flow to an Aura bundle', () => {
        const graph = buildDependencyGraph([
            defUnit('aura', 'aura', 'myAura'),
            defUnit('lwc', 'lwc', 'myLwc'),
            refUnit('flexiPage', 'Page', [
                { refType: 'lwc', target: 'myAura', via: 'components' },
                { refType: 'lwc', target: 'myLwc', via: 'components' },
                { refType: 'lwc', target: 'nothing', via: 'components' },
            ]),
            refUnit('flow', 'Screen_Flow', [
                { refType: 'lwc', target: 'myAura', via: 'flow.screens' },
            ]),
        ]);
        const targets = graph.edges.map((e) => e.to);
        assert.ok(targets.includes('aura:myAura'));
        assert.ok(targets.includes('lwc:myLwc'));
        assert.ok(!graph.nodes.has('lwc:myAura'));
        assert.deepEqual(
            graph.findings.map((f) => `${f.code} ${f.target}`),
            ['UNKNOWN_LWC lwc:nothing'],
        );
    });

    it('does not resolve LWC imports / templates to Aura', () => {
        const graph = buildDependencyGraph([
            defUnit('aura', 'aura', 'myAura'),
            defUnit('lwc', 'lwc', 'myLwc'),
            refUnit('lwc', 'other', [{ refType: 'lwc', target: 'myAura', via: 'import' }]),
        ]);
        assert.deepEqual(
            graph.findings.map((f) => f.target),
            ['lwc:myAura'],
        );
    });

    it('treats non-c Flow screen components as standard', () => {
        const graph = buildDependencyGraph([
            defUnit('aura', 'aura', 'myAura'),
            refUnit('flow', 'Screen_Flow', [
                { refType: 'aura', target: 'forceContent:fileUpload', via: 'flow.screens' },
                { refType: 'aura', target: 'flowruntime:address', via: 'flow.screens' },
            ]),
        ]);
        assert.deepEqual(graph.findings, []);
        assert.equal(graph.nodes.get('aura:forceContent:fileUpload')?.origin, 'standard');
    });

    it('connects $CustomMetadata records in formulas to customMetadata definitions', () => {
        const refs = getFormulaReferences('$CustomMetadata.Conf__mdt.Default.Rate__c > 0');
        assert.deepEqual(
            refs.map((r) =>
                'name' in r ? `${r.refType}:${r.name}` : `field:${r.object}.${r.field}`,
            ),
            ['object:Conf__mdt', 'customMetadata:Conf.Default', 'field:Conf__mdt.Rate__c'],
        );
        const graph = buildDependencyGraph([
            defUnit('customMetadata', 'customMetadata', 'Conf.Default'),
            refUnit('object', 'Invoice__c', [
                { refType: 'customMetadata', target: 'Conf.Default', via: 'formula' },
                { refType: 'customMetadata', target: 'Conf.Missing', via: 'formula' },
            ]),
        ]);
        const targets = graph.edges.map((e) => e.to);
        assert.ok(targets.includes('customMetadata:Conf.Default'));
        assert.equal(graph.nodes.get('customMetadata:Conf.Default')?.origin, 'repository');
        assert.deepEqual(
            graph.findings.map((f) => f.target),
            ['customMetadata:Conf.Missing'],
        );
    });
    it('reads custom settings and custom metadata types from Apex (not as fields)', async () => {
        const source = [
            'public class Settings {',
            '    public void run() {',
            '        Decimal rate = Conf__c.getInstance().Rate__c;',
            '        Conf__c org = Conf__c.getOrgDefaults();',
            "        Conf__c named = Conf__c.getValues('Tokyo');",
            '        Map<String, Conf__c> all = Conf__c.getAll();',
            "        App__mdt one = App__mdt.getInstance('Default');",
            "        App__mdt other = App__mdt.getAll().get('Sandbox');",
            '    }',
            '}',
        ].join('\n');
        const unit = await parseApexUnitFiles({
            unitType: 'class',
            name: 'Settings',
            filePath: 'Settings.cls',
            source: { fileName: 'Settings.cls', source },
        });
        const dependencies = getApexDependencies(unit);
        const refs = dependencies.references
            .filter((r) => r.refType !== 'apexType')
            .map((r) => `${r.kind} ${r.refType}:${r.target} (${r.via})`);
        assert.deepEqual([...new Set(refs)].sort(), [
            'reads customMetadata:App.Default (customMetadata)',
            'reads customMetadata:App.Sandbox (customMetadata)',
            'reads field:Conf__c.Rate__c (customSetting)',
            'reads object:App__mdt (customMetadata)',
            'reads object:Conf__c (customSetting)',
        ]);
        const graph = buildDependencyGraph([
            { type: 'apexClass', id: 'class_Settings', dependencies },
            defUnit('object', 'object', 'Conf__c'),
            defUnit('customMetadata', 'customMetadata', 'App.Default'),
        ]);
        assert.ok(![...graph.nodes.keys()].some((id) => /getInstance|getAll/.test(id)));
        assert.equal(graph.nodes.get('customMetadata:App.Default')?.origin, 'repository');
        assert.ok(graph.edges.some((e) => e.to === 'object:Conf__c' && e.kind === 'reads'));
    });

    it('defines @api fields and getter / setter properties of LWC', () => {
        const api = { decorator: [{ kind: 'lwcDecorator', name: 'api' }] };
        const unit = {
            filePath: 'lwc/card',
            resolvedError: [],
            dataType: 'lwcBundle',
            result: {
                id: 'card',
                base: {
                    kind: 'lwcBundle',
                    component: {
                        kind: 'lwcComponent',
                        block: [
                            { kind: 'lwcField', name: 'title', modifier: api },
                            { kind: 'lwcField', name: 'internal', modifier: {} },
                            {
                                kind: 'lwcProperty',
                                name: 'size',
                                isGetter: true,
                                getterContent: { modifier: api },
                                isSetter: false,
                            },
                        ],
                    },
                },
                sourceObject: [],
            },
        } as unknown as LwcBundleParseResult;
        assert.deepEqual(
            getLwcDependencies(unit).definitions.map((d) => `${d.defType}:${d.name}`),
            ['lwc:card', 'lwcProperty:card.title', 'lwcProperty:card.size'],
        );
    });

    it('defines message channels, external credentials and report types', async () => {
        const root = repositoryOf('after');
        const units = (
            await Promise.all(
                [
                    LightningMessageChannelParser,
                    ExternalCredentialParser,
                    ReportTypeParser,
                    NamedCredentialParser,
                ].map((parser) => parser.parseAll(root)),
            )
        )
            .flat()
            .map((r): GraphUnit => ({
                type: r.dataType,
                id: r.result.id,
                dependencies: getUnitDependencies(r.dataType, r),
            }));
        // LWC の import (@salesforce/messageChannel/Invoice_Selected__c) は __c を除いた名前で参照する
        units.push(
            refUnit('lwc', 'invoiceList', [
                { refType: 'messageChannel', target: 'Invoice_Selected', via: 'import' },
                { refType: 'messageChannel', target: 'Missing_Channel', via: 'import' },
            ]),
        );
        const graph = buildDependencyGraph(units);
        for (const id of [
            'messageChannel:Invoice_Selected',
            'externalCredential:Billing_Auth',
            'reportType:Invoices_with_Lines',
        ]) {
            assert.equal(graph.nodes.get(id)?.origin, 'repository', id);
        }
        // 指定ログイン情報 → 外部ログイン情報
        assert.ok(
            graph.edges.some(
                (e) =>
                    e.to === 'externalCredential:Billing_Auth' &&
                    e.unit.id === 'namedCredential_Billing_API',
            ),
        );
        assert.ok(graph.edges.some((e) => e.to === 'messageChannel:Invoice_Selected'));
        assert.deepEqual(
            graph.findings.map((f) => `${f.code} ${f.target}`),
            ['UNKNOWN_MESSAGE_CHANNEL messageChannel:Missing_Channel'],
        );
    });

    it('references a custom report type from a report (<name>__c)', () => {
        const refsOf = (reportType: string) =>
            analyzeMetadataRefs('report', { kind: 'report', reportType }, 'R/Rep').map(
                (r) => `${r.refType}:${r.target}`,
            );
        assert.deepEqual(refsOf('Invoices_with_Lines__c'), ['reportType:Invoices_with_Lines']);
        assert.deepEqual(refsOf('CustomEntity$Invoice__c'), ['object:Invoice__c']);
        assert.deepEqual(refsOf('Opportunity'), []);
    });
});

describe('リポジトリにない参照先の分類 (確かめた標準だけ standard。docs/plan.md 10 章 P2)', () => {
    it('標準の一覧に当たらないオブジェクト・型・項目・子リレーションは unknown', () => {
        const graph = buildDependencyGraph([
            defUnit('object', 'object', 'Invoice__c'),
            refUnit('apexClass', 'Uses', [
                { refType: 'object', target: 'Contact', via: 'type' },
                { refType: 'object', target: 'NotAnObject', via: 'type' },
                { refType: 'apexType', target: 'String', via: 'type' },
                { refType: 'apexType', target: 'Database.SaveResult', via: 'type' },
                { refType: 'apexType', target: 'AggregateResult', via: 'type' },
                { refType: 'apexType', target: 'MissingHelper', via: 'type' },
                { refType: 'field', target: 'Contact.Email', via: 'soql.select' },
                { refType: 'field', target: 'Invoice__c.Name', via: 'soql.select' },
                { refType: 'field', target: 'Invoice__c.Status', via: 'soql.select' },
                { refType: 'field', target: 'NotAnObject.Status', via: 'soql.select' },
                { refType: 'childRelationship', target: 'Account.Contacts', via: 'soql.from' },
                { refType: 'childRelationship', target: 'Thing.Children', via: 'soql.from' },
            ]),
        ]);
        const originOf = (id: string) => graph.nodes.get(id)?.origin;
        assert.equal(originOf('object:Contact'), 'standard');
        assert.equal(originOf('object:NotAnObject'), 'unknown');
        assert.equal(originOf('apexType:String'), 'standard');
        assert.equal(originOf('apexType:Database.SaveResult'), 'standard');
        assert.equal(originOf('apexType:AggregateResult'), 'standard');
        assert.equal(originOf('apexType:MissingHelper'), 'unknown');
        // 標準オブジェクトの項目と、どのオブジェクトにもある項目 (Name) は standard
        assert.equal(originOf('field:Contact.Email'), 'standard');
        assert.equal(originOf('field:Invoice__c.Name'), 'standard');
        assert.equal(originOf('field:Invoice__c.Status'), 'unknown');
        assert.equal(originOf('field:NotAnObject.Status'), 'unknown');
        assert.equal(originOf('childRelationship:Account.Contacts'), 'standard');
        assert.equal(originOf('childRelationship:Thing.Children'), 'unknown');
    });
});

describe('辺の確かさ (DependencyEdge.resolution。missing はリポジトリの定義と突き合わせて決める)', () => {
    it('リポジトリにあれば resolved、リポジトリにも標準にもなければ missing、標準なら standard、分からなければ byName', () => {
        const graph = buildDependencyGraph([
            defUnit('object', 'object', 'Invoice__c'),
            refUnit('apexClass', 'Uses', [
                { refType: 'object', target: 'Invoice__c', via: 'type' },
                { refType: 'object', target: 'Gone__c', via: 'type' },
                { refType: 'object', target: 'Contact', via: 'type' },
                { refType: 'object', target: 'NotAnObject', via: 'type' },
            ]),
        ]);
        const resolutionOf = (to: string) =>
            graph.edges.find((e) => e.to === to)?.resolution ?? 'byName';
        assert.equal(resolutionOf('object:Invoice__c'), 'resolved');
        assert.equal(resolutionOf('object:Gone__c'), 'missing');
        assert.equal(resolutionOf('object:Contact'), 'standard');
        assert.equal(resolutionOf('object:NotAnObject'), 'byName');
    });
});

describe('SOQL の関係のパス (fieldPath。スキーマで項目までたどる)', () => {
    it('カスタムの参照項目と標準の関係をたどって、2 段目からの参照項目と最後の項目を参照にする', async () => {
        const unit = await parseApexUnitFiles({
            unitType: 'class',
            name: 'Paths',
            filePath: 'Paths.cls',
            source: {
                fileName: 'Paths.cls',
                source: [
                    'public class Paths {',
                    '    void run() {',
                    '        List<Line__c> lines = [SELECT Invoice__r.Account__r.Owner.Name, Invoice__r.What.Name FROM Line__c];',
                    '        List<Contact> contacts = [SELECT Account.Owner.Email, Name FROM Contact];',
                    '    }',
                    '}',
                ].join('\n'),
            },
        });
        const dependencies = getApexDependencies(unit);
        const refs = dependencies.references
            .filter((r) => r.refType === 'field' || r.refType === 'fieldPath')
            .map((r) => `${r.refType}:${r.target}`);
        // 単位の参照は 1 段目の参照項目とパス全体 (同じ参照項目は 1 つ)
        assert.deepEqual(refs.sort(), [
            'field:Contact.AccountId',
            'field:Contact.Name',
            'field:Line__c.Invoice__c',
            'fieldPath:Contact.Account.Owner.Email',
            'fieldPath:Line__c.Invoice__r.Account__r.Owner.Name',
            'fieldPath:Line__c.Invoice__r.What.Name',
        ]);
        // リポジトリのオブジェクトの参照項目 (Line__c.Invoice__c → Invoice__c、Invoice__c.Account__c → Account)
        const objectUnit = (name: string, lookups: [string, string][]): GraphUnit => ({
            type: 'object',
            id: name,
            dependencies: {
                definitions: [
                    { defType: 'object', name },
                    ...lookups.map(([field]) => ({ defType: 'field', name: `${name}.${field}` })),
                ],
                references: [],
                childRelationships: lookups.map(([field, parent]) => ({
                    parent,
                    name: `${name}s__r`,
                    child: name,
                    field: `${name}.${field}`,
                })),
            },
        });
        const graph = buildDependencyGraph([
            { type: 'apexClass', id: 'Paths', dependencies },
            objectUnit('Line__c', [['Invoice__c', 'Invoice__c']]),
            objectUnit('Invoice__c', [['Account__c', 'Account']]),
        ]);
        const fields = [
            ...new Set(
                graph.edges
                    .filter((e) => e.to.startsWith('field:'))
                    .map((e) => e.to.slice('field:'.length)),
            ),
        ].sort();
        assert.deepEqual(fields, [
            'Account.OwnerId',
            'Contact.AccountId',
            'Contact.Name',
            'Invoice__c.Account__c',
            // 多態の関係 (What) の参照項目までは参照にし、その先 (What.Name) は参照にしない
            'Invoice__c.WhatId',
            'Line__c.Invoice__c',
            // Account.OwnerId の先の User.Name・User.Email
            'User.Email',
            'User.Name',
        ]);
    });

    it('Apex の変数のメンバーの連鎖 (a.Owner.Name・this.acc.Owner.ManagerId) も、関係のパスとしてたどる', async () => {
        const unit = await parseApexUnitFiles({
            unitType: 'class',
            name: 'Members',
            filePath: 'Members.cls',
            source: {
                fileName: 'Members.cls',
                source: [
                    'public class Members {',
                    '    Account acc;',
                    '    void run(Account a, Invoice__c i) {',
                    '        String n = a.Owner.Name;',
                    '        Id m = this.acc.Owner.ManagerId;',
                    '        String o = i.Account__r.Name;',
                    '    }',
                    '}',
                ].join('\n'),
            },
        });
        const dependencies = getApexDependencies(unit);
        const refs = dependencies.references
            .filter((r) => r.refType === 'field' || r.refType === 'fieldPath')
            .map((r) => `${r.refType}:${r.target}`);
        assert.deepEqual([...new Set(refs)].sort(), [
            'field:Account.OwnerId',
            'field:Invoice__c.Account__c',
            'fieldPath:Account.Owner.ManagerId',
            'fieldPath:Account.Owner.Name',
            'fieldPath:Invoice__c.Account__r.Name',
        ]);
        // 関係の名前そのもの (Account.Owner) を項目にしない
        assert.ok(!dependencies.references.some((r) => r.target === 'Account.Owner'));
        const graph = buildDependencyGraph([{ type: 'apexClass', id: 'Members', dependencies }]);
        const fields = new Set(graph.edges.map((e) => e.to));
        assert.ok(fields.has('field:User.Name'));
        assert.ok(fields.has('field:User.ManagerId'));
    });
});
