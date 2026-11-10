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
import { extractMetadataReferences } from '../../src/analyzer/processor/Metadata/referenceAnalysis';
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
                {
                    refType: 'auraComponent',
                    target: 'forceContent:fileUpload',
                    via: 'flow.screens',
                },
                { refType: 'auraComponent', target: 'flowruntime:address', via: 'flow.screens' },
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
        const report = (reportType: string) =>
            ({
                filePath: 'reports/R/Rep.report-meta.xml',
                resolvedError: [],
                dataType: 'report',
                result: {
                    id: 'report_R/Rep',
                    base: { kind: 'report', reportType },
                    sourceObject: [],
                },
            }) as unknown as MetadataFileParseResult;
        const show = (r: { refType: string; target: string }) => `${r.refType}:${r.target}`;
        assert.deepEqual(extractMetadataReferences(report('Invoices_with_Lines__c')).map(show), [
            'reportType:Invoices_with_Lines',
        ]);
        assert.deepEqual(extractMetadataReferences(report('CustomEntity$Invoice__c')).map(show), [
            'object:Invoice__c',
        ]);
        assert.deepEqual(extractMetadataReferences(report('Opportunity')).map(show), []);
    });
});
