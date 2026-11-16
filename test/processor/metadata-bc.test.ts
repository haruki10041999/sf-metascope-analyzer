import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import {
    ApexComponentParser,
    ApexPageParser,
    AuraParser,
    CustomApplicationParser,
    CustomMetadataRecordParser,
    CustomPermissionParser,
    CustomTabParser,
    EmailTemplateParser,
    METADATA_FOLDER_PARSERS,
    MetadataFileParseResult,
    PermissionSetParser,
    ReportParser,
    findParserBySaveId,
} from '../../src/analyzer/parser/Metadata';
import { ApexParser } from '../../src/analyzer/parser/Apex/parser';
import { LwcParser } from '../../src/analyzer/parser/Lwc/parser';
import { MetadataParser } from '../../src/analyzer/parser/Metadata/parser';
import { ObjectTranslationParser } from '../../src/analyzer/parser/Metadata/objectTranslation';
import { METADATA_UNIT_DIFFS, makeObjectUnitDiffs } from '../../src/analyzer/processor/Metadata';
import {
    buildDependencyGraph,
    getDependents,
    toLevel,
} from '../../src/analyzer/processor/dependency/graph';
import { getUnitDependencies } from '../../src/analyzer/processor/dependency/units';
import { Repository, WorkingTree, analyzeDependencies } from '../../src/analyzer/unit';
import type {
    ApexComponentJson,
    ApexPageJson,
    AuraBundleJson,
    CustomApplicationJson,
    CustomMetadataRecordJson,
    EmailTemplateJson,
    ReportJson,
} from '../../src/analyzer/types';
import { criterionTextsOf, templateTextOf } from '../../src/analyzer/types';
import { markupTagsOf } from '../../src/analyzer/processor/Metadata/markup';

// 優先度 B・C のメタデータ (docs/metadata-implementation.md) 10 章。サンプルは docs/examples/repository

const root = (side: 'before' | 'after') =>
    path.resolve('docs/examples/repository', side, 'force-app/main/default');

const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';

const base = <J>(results: MetadataFileParseResult[], id: string) =>
    results.find((r) => r.result.id === id)!.result.base as J;

type Unit = { id: string; status: string; content?: { fields?: Record<string, unknown> } };

const unitDiffs = async (type: string): Promise<Unit[]> => {
    const parser = METADATA_FOLDER_PARSERS.find((p) => p.spec.type === type)!;
    return METADATA_UNIT_DIFFS[type]!(
        await parser.parseAll(root('before')),
        await parser.parseAll(root('after')),
    ) as unknown as Unit[];
};

type Row = {
    status: string;
    value?: Record<string, unknown>;
    fields?: Record<string, { value?: unknown; after?: unknown }>;
};

/** 子の差分 (要素名の配列) を [status, キー] の並びにする */
const childStatuses = (unit: Unit, element: string, key: string) =>
    ((unit.content!.fields![element] ?? []) as Row[]).map((c) => [
        c.status,
        c.value?.[key] ?? c.fields?.[key]?.value ?? c.fields?.[key]?.after,
    ]);

/** JSON の中の skippedElements をすべて集める */
const skippedIn = (value: unknown, found: string[] = []): string[] => {
    if (Array.isArray(value)) value.forEach((item) => skippedIn(item, found));
    else if (typeof value === 'object' && value !== null) {
        const record = value as Record<string, unknown>;
        if (Array.isArray(record.skippedElements))
            found.push(...(record.skippedElements as string[]));
        Object.values(record).forEach((child) => skippedIn(child, found));
    }
    return found;
};

describe('優先度 B・C: 種類ごとの型 (表から作る JSON)', () => {
    it('値は要素名のプロパティ (型をそろえる)、名前で対応付ける子は要素名の配列。属性のある値は値の木', () => {
        const result = CustomMetadataRecordParser.parseSource(
            'customMetadata/App_Setting.Default.md-meta.xml',
            `<CustomMetadata ${NS} xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
                <label>Default</label>
                <protected>false</protected>
                <unknownElement>x</unknownElement>
                <values><field>Value__c</field><value xsi:type="xsd:string">100</value></values>
            </CustomMetadata>`,
        );
        assert.equal(result.result.id, 'customMetadata_App_Setting.Default');
        const json = result.result.base as CustomMetadataRecordJson;
        assert.equal(json.fullName, 'App_Setting.Default');
        assert.equal(json.label, 'Default');
        assert.equal(json.protected, false);
        // 表にない要素は skippedElements
        assert.deepEqual(json.skippedElements, ['unknownElement']);
        const [value] = json.values!;
        assert.equal(value!.kind, 'customMetadataValue');
        assert.equal(value!.field, 'Value__c');
        assert.deepEqual(value!.value, { '#text': '100', '@xsi:type': 'xsd:string' });
    });

    it('繰り返す値 (lists) は 1 つでも配列', async () => {
        const app = base<CustomApplicationJson>(
            await CustomApplicationParser.parseAll(root('before')),
            'customApplication_Invoice_App',
        );
        assert.deepEqual(app.formFactors, ['Large']);
        assert.deepEqual(app.tabs, ['standard-Account', 'Invoice__c']);
        assert.equal(app.actionOverrides![0]!.content, 'Invoice_Record_Page');
    });

    it('サンプルの要素は、表にない要素 (skippedElements) が意図したものだけ', async () => {
        const skipped: string[] = [];
        for (const parser of METADATA_FOLDER_PARSERS) {
            for (const side of ['before', 'after'] as const) {
                (await parser.parseAll(root(side))).forEach((r) =>
                    skippedIn(r.result.base, skipped),
                );
            }
        }
        // Profile の futureSetting と Layout の summaryLayout は、表にない要素のサンプルとしてわざと置いている
        assert.deepEqual([...new Set(skipped)].sort(), ['futureSetting', 'summaryLayout']);
    });

    it('子はキーで対応付ける (選択リスト値・共有ルール・承認のステップ)', async () => {
        const [values] = await unitDiffs('globalValueSet');
        assert.deepEqual(childStatuses(values!, 'customValue', 'fullName'), [
            ['unchanged', 'Draft'],
            ['removed', 'Sent'],
            ['changed', 'Paid'],
            ['added', 'Overdue'],
        ]);
        const [sharing] = await unitDiffs('sharingRules');
        assert.deepEqual(childStatuses(sharing!, 'sharingCriteriaRules', 'fullName'), [
            ['changed', 'Large_Invoices'],
            ['added', 'Small_Invoices'],
        ]);
        // 片方にしかない要素は配列ごと removed
        assert.equal(
            (sharing!.content!.fields!.sharingOwnerRules as { status: string }).status,
            'removed',
        );
        const [approval] = await unitDiffs('approvalProcess');
        assert.deepEqual(childStatuses(approval!, 'approvalStep', 'name'), [
            ['unchanged', 'Manager'],
            ['added', 'Finance'],
        ]);
    });

    it('入れ子のフォルダ (reports/<フォルダ>/) は fullName が <フォルダ>/<名前>、保存名は . でつなぐ', async () => {
        const reports = await ReportParser.parseAll(root('after'));
        assert.deepEqual(
            reports.map((r) => [r.result.id, (r.result.base as ReportJson).fullName]),
            [['report_Invoice_Reports.Open_Invoices', 'Invoice_Reports/Open_Invoices']],
        );
        // XML の <name> (表示名) は name
        assert.equal((reports[0]!.result.base as ReportJson).name, 'Open Invoices');
        assert.equal(findParserBySaveId('report_Invoice_Reports.Open_Invoices'), ReportParser);
        const [diff] = await unitDiffs('report');
        assert.deepEqual(childStatuses(diff!, 'columns', 'field'), [
            ['unchanged', 'CUST_NAME'],
            ['removed', 'Invoice__c.Due_Date__c'],
            ['unchanged', 'Invoice__c.Amount__c'],
            ['added', 'Invoice__c.Status__c'],
        ]);
    });
});

describe('優先度 B: 本体のファイルを伴う種類・バンドル', () => {
    it('Visualforce: -meta.xml の値と、本体のルートの属性・使っている部品・apex:attribute', async () => {
        const page = base<ApexPageJson>(
            await ApexPageParser.parseAll(root('after')),
            'apexPage_InvoicePrint',
        );
        assert.equal(page.apiVersion, '61.0');
        assert.ok(page.markup && page.markup.kind === 'visualforceMarkup');
        assert.deepEqual(page.markup.attributes, {
            standardController: 'Invoice__c',
            extensions: 'InvoicePrintExt',
            renderAs: 'advanced_pdf',
        });
        // 使っている部品は本体の木から出す (段階 M6)
        assert.deepEqual(markupTagsOf(page.markup.body), [
            'apex:column',
            'apex:outputField',
            'apex:pageBlockTable',
            'c:invoiceHeader',
        ]);
        const component = base<ApexComponentJson>(
            await ApexComponentParser.parseAll(root('after')),
            'apexComponent_invoiceHeader',
        );
        assert.ok(component.markup && component.markup.kind === 'visualforceMarkup');
        assert.deepEqual(
            component.markup.componentAttributes!.map((a) => a.name),
            ['invoice', 'showLogo'],
        );
    });

    it('Visualforce: 本体が XML として読めなければ markup を持たない (-meta.xml の値は読む。理由は resolvedError)', () => {
        const result = ApexPageParser.parseSource(
            'pages/Bad.page-meta.xml',
            `<ApexPage ${NS}><apiVersion>61.0</apiVersion></ApexPage>`,
            {
                extras: [
                    {
                        fileName: 'Bad.page',
                        filePath: 'pages/Bad.page',
                        source: '<apex:page><p></apex:page>',
                    },
                ],
            },
        );
        assert.equal(result.dataType, 'apexPage');
        assert.equal((result.result.base as ApexPageJson).markup, undefined);
        assert.equal(result.resolvedError[0]!.filePath, 'pages/Bad.page');
    });

    it('メールテンプレート: -meta.xml の値と本文', async () => {
        const [template] = await EmailTemplateParser.parseAll(root('after'));
        const json = template!.result.base as EmailTemplateJson;
        assert.equal(json.fullName, 'Invoice_Templates/Invoice_Sent');
        assert.equal(json.available, true);
        // 本文は差し込みを含むので fxTemplate (段階 M6)
        assert.ok(templateTextOf(json.body!).startsWith('{!Invoice__c.Account__c} 様'));
        const [diff] = await unitDiffs('emailTemplate');
        assert.equal((diff!.content!.fields!.body as { status: string }).status, 'changed');
        assert.equal((diff!.content!.fields!.subject as { status: string }).status, 'changed');
    });

    it('Aura: バンドルが 1 単位。宣言・使っている部品・JS の関数・ファイル・-meta.xml', async () => {
        const results = await AuraParser.parseAll(root('after'));
        assert.deepEqual(
            results.map((r) => [r.result.id, r.dataType]),
            [
                ['aura_brokenCard', 'error'],
                ['aura_invoiceCard', 'aura'],
            ],
        );
        const card = base<AuraBundleJson>(results, 'aura_invoiceCard');
        assert.equal(card.bundleType, 'cmp');
        assert.equal(card.rootAttributes.controller, 'InvoiceController');
        assert.deepEqual(
            card.attributes!.map((a) => a.name),
            ['recordId', 'invoice', 'showLines'],
        );
        assert.deepEqual(markupTagsOf(card.body), [
            'c:accountList',
            'lightning:button',
            'lightning:card',
        ]);
        assert.deepEqual(card.javascript, {
            controller: ['doInit', 'handleClick', 'toggleLines'],
            helper: ['load'],
        });
        assert.ok(card.files.includes('invoiceCard.css'));
        assert.ok(card.meta && card.meta.kind === 'auraDefinitionBundle');
        assert.equal(card.meta.apiVersion, '61.0');

        const diff = (await unitDiffs('aura')).find((d) => d.id === 'aura_invoiceCard')!;
        const fields = diff.content!.fields as Record<string, unknown>;
        assert.equal((fields.handlers as { status: string }).status, 'removed');
        assert.equal((fields.methods as { status: string }).status, 'added');
        assert.deepEqual(
            (
                fields.attributes as {
                    status: string;
                    value?: { name: string };
                    fields?: { name: { value: string } };
                }[]
            ).map((a) => [a.status, a.value?.name ?? a.fields?.name.value]),
            [
                ['unchanged', 'recordId'],
                ['changed', 'invoice'],
                ['added', 'showLines'],
            ],
        );
    });
});

describe('優先度 B・C: すべての種類', () => {
    it('サンプルのすべての種類が読めて、before → after の差分を作れる', async () => {
        for (const parser of METADATA_FOLDER_PARSERS) {
            const after = await parser.parseAll(root('after'));
            assert.ok(after.length > 0, parser.spec.type);
            assert.ok(METADATA_UNIT_DIFFS[parser.spec.type], parser.spec.type);
            const diffs = METADATA_UNIT_DIFFS[parser.spec.type]!(
                await parser.parseAll(root('before')),
                after,
            );
            assert.ok(
                diffs.some((d) => d.status !== 'unchanged'),
                parser.spec.type,
            );
        }
    });
});

// 種類をまたぐ参照の突き合わせは依存関係のグラフで見る (以前の analyzeMetadataReferences。docs/json-redesign-plan.md 6 章の 9)
describe('種類をまたぐ参照 (依存関係のグラフ)', () => {
    const graphOf = (results: MetadataFileParseResult[]) =>
        buildDependencyGraph(
            results.map((result) => ({
                type: result.dataType,
                id: result.result.id,
                dependencies: getUnitDependencies(result.dataType, result),
            })),
        );

    it('サンプル: ない参照先を見つけ、参照先ごとの参照元 (逆引き) を作る', async () => {
        const graph = analyzeDependencies(
            await Repository.load(new WorkingTree(path.resolve('docs/examples/repository/after'))),
        );
        const findings = graph.findings.map(
            (f) => `${f.code}:${toLevel(graph, f.from, 'unit')}:${f.target}`,
        );
        for (const expected of [
            'UNKNOWN_FLEXI_PAGE:customApplication:Invoice_App:flexiPage:Invoice_Record_Page_V2',
            'UNKNOWN_APEX_CLASS:apexPage:InvoicePrint:apexClass:InvoicePrintExt',
            'UNKNOWN_APEX_CLASS:aura:invoiceCard:apexClass:InvoiceController',
            'UNKNOWN_AURA:aura:invoiceCard:aura:invoiceSelectedEvent',
            'UNKNOWN_ROLE:role:Sales_Manager:role:CEO',
        ]) {
            assert.ok(findings.includes(expected), expected);
        }
        const usedBy = (id: string) =>
            [...getDependents(graph, id, { level: 'unit' }).keys()].sort();
        assert.deepEqual(usedBy('emailTemplate:Invoice_Templates/Invoice_Sent'), []);
        assert.deepEqual(usedBy('report:Invoice_Reports/Open_Invoices'), [
            'dashboard:Invoice_Dashboards/Invoice_Overview',
        ]);
        assert.deepEqual(usedBy('customLabel:AccountListTitle'), [
            'apexPage:InvoicePrint',
            'aura:invoiceCard',
            'flow:Account_Wizard',
            'translations:ja',
        ]);
        // Aura の c: の部品は LWC か Aura のどちらかにあればよい
        assert.ok(usedBy('lwc:accountList').includes('aura:invoiceCard'));
    });

    it('権限セットのカスタム権限・タブ・アプリへの参照も確かめる。名前空間付き・標準のタブは確かめない', () => {
        const permissionSet = PermissionSetParser.parseSource(
            'permissionsets/X.permissionset-meta.xml',
            `<PermissionSet ${NS}>
                <customPermissions><enabled>true</enabled><name>Missing_Permission</name></customPermissions>
                <customPermissions><enabled>true</enabled><name>acme__Packaged</name></customPermissions>
                <tabSettings><tab>standard-Account</tab><visibility>Visible</visibility></tabSettings>
                <tabSettings><tab>Missing_Tab</tab><visibility>Visible</visibility></tabSettings>
            </PermissionSet>`,
        );
        const permission = CustomPermissionParser.parseSource(
            'customPermissions/Approve.customPermission-meta.xml',
            `<CustomPermission ${NS}><label>Approve</label></CustomPermission>`,
        );
        const tab = CustomTabParser.parseSource(
            'tabs/Invoice__c.tab-meta.xml',
            `<CustomTab ${NS}><customObject>true</customObject></CustomTab>`,
        );
        const graph = graphOf([permissionSet, permission, tab]);
        assert.deepEqual(
            graph.findings.map((f) => `${f.code}:${f.target}`),
            [
                'UNKNOWN_CUSTOM_PERMISSION:customPermission:Missing_Permission',
                'UNKNOWN_CUSTOM_TAB:customTab:Missing_Tab',
            ],
        );
        // 権限は与えるもの (grants)
        assert.ok(
            graph.edges.some(
                (e) => e.to === 'customPermission:Missing_Permission' && e.kind === 'grants',
            ),
        );
        assert.equal(graph.nodes.get('customPermission:acme__Packaged')?.origin, 'managed');
    });
});

describe('オブジェクトの読んでいなかった子・文字列からの parse', () => {
    const objects = (side: 'before' | 'after') => path.join(root(side), 'objects');

    it('ビジネスプロセス・共有の理由・検索レイアウト・アクションの上書き・参照項目の絞り込み条件を読み、差分を作る', async () => {
        const [before, after] = await Promise.all([
            MetadataParser.parseObjects(objects('before')),
            MetadataParser.parseObjects(objects('after')),
        ]);
        const invoice = after.find((r) => r.result.id === 'Invoice__c')!;
        assert.equal(invoice.dataType, 'object');
        if (invoice.dataType !== 'object') return;
        const json = invoice.result.base;
        assert.deepEqual(json.searchLayouts, {
            customTabListAdditionalFields: ['Amount__c', 'Status__c'],
            searchResultsAdditionalFields: ['Account__c', 'Amount__c'],
        });
        assert.equal(json.actionOverrides![0]!.content, 'Invoice_Record_Page');
        assert.equal(json.sharingReasons![0]!.kind, 'sharingReason');
        const account = json.fields!.find((f) => f.kind === 'field' && f.apiName === 'Account__c');
        assert.ok(account && account.kind === 'field');
        // 条件の行は criterion (段階 M5)
        assert.deepEqual(account.lookupFilter!.filterItems.map(criterionTextsOf), [
            { left: 'Account.Tier__c', right: 'Bronze' },
        ]);
        assert.equal(account.lookupFilter!.filterItems[0]!.operator, 'notEqual');

        const diffs = makeObjectUnitDiffs(before, after);
        const fieldsOf = (id: string) =>
            (diffs.find((d) => d.id === id)!.content as { fields: Record<string, unknown> }).fields;
        const invoiceDiff = fieldsOf('Invoice__c');
        assert.deepEqual(
            (
                (invoiceDiff.searchLayouts as Record<string, { status: string; value: string }[]>)
                    .customTabListAdditionalFields ?? []
            ).map((v) => `${v.status}:${v.value}`),
            ['unchanged:Amount__c', 'removed:Due_Date__c', 'added:Status__c'],
        );
        assert.equal((invoiceDiff.sharingReasons as { status: string }[])[0]!.status, 'changed');
        assert.equal((invoiceDiff.actionOverrides as { status: string }[])[0]!.status, 'unchanged');
        const opportunity = fieldsOf('Opportunity');
        const [process] = opportunity.businessProcesses as {
            status: string;
            fields: { values: { status: string; value: { fullName: string } }[] };
        }[];
        assert.equal(process!.status, 'changed');
        assert.deepEqual(
            process!.fields.values
                .filter((v) => v.status !== 'unchanged')
                .map((v) => v.value.fullName),
            ['Negotiation/Review'],
        );
    });

    it('オブジェクト・翻訳を文字列から読める (フォルダから読んだ結果と、filePath 以外は同じ)', async () => {
        const directory = path.join(objects('after'), 'Invoice__c');
        const fromFolder = await MetadataParser.parseObject(directory);
        const files = [
            'Invoice__c.object-meta.xml',
            'fields/Account__c.field-meta.xml',
            'fields/Amount__c.field-meta.xml',
            'fields/Approved__c.field-meta.xml',
            'fields/Due_Date__c.field-meta.xml',
            'fields/Is_Overdue__c.field-meta.xml',
            'fields/Status__c.field-meta.xml',
            'fieldSets/Summary.fieldSet-meta.xml',
            'recordTypes/Standard.recordType-meta.xml',
            'sharingReasons/Approver__c.sharingReason-meta.xml',
            'validationRules/Amount_Positive.validationRule-meta.xml',
            'validationRules/Due_Date_Required.validationRule-meta.xml',
            'webLinks/Send_Invoice.webLink-meta.xml',
        ].map((relative) => ({
            fileName: path.basename(relative),
            filePath: `Invoice__c/${relative}`,
            source: readFileSync(path.join(directory, relative), 'utf8'),
        }));
        const fromSource = MetadataParser.parseObjectSource('Invoice__c', files);
        assert.equal(fromSource.filePath, 'Invoice__c');
        assert.deepEqual({ ...fromSource, filePath: '' }, { ...fromFolder, filePath: '' });

        const translationDir = path.join(root('after'), 'objectTranslations', 'Invoice__c-ja');
        const translationFromFolder =
            await ObjectTranslationParser.parseObjectTranslation(translationDir);
        const translationFiles = readdirSync(translationDir).map((fileName) => ({
            fileName,
            filePath: `Invoice__c-ja/${fileName}`,
            source: readFileSync(path.join(translationDir, fileName), 'utf8'),
        }));
        const translationFromSource = ObjectTranslationParser.parseObjectTranslationSource(
            'Invoice__c-ja',
            translationFiles,
        );
        assert.deepEqual(
            { ...translationFromSource, filePath: '' },
            { ...translationFromFolder, filePath: '' },
        );
    });
});
