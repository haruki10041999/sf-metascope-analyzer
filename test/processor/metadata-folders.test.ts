import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { ApexParser } from '../../src/analyzer/parser/Apex/parser';
import { MetadataParser } from '../../src/analyzer/parser/Metadata/parser';
import {
    CustomLabelsParser,
    FlexiPageParser,
    FlowParser,
    LayoutParser,
    METADATA_FOLDER_PARSERS,
    MetadataFileParseResult,
    MutingPermissionSetParser,
    PermissionSetGroupParser,
    PermissionSetParser,
    ProfileParser,
    findParserByFolder,
    findParserBySaveId,
} from '../../src/analyzer/parser/Metadata';
import {
    analyzeAutomation,
    analyzeCustomLabels,
    apexContextOf,
    getApexTriggers,
    makeFlexiPageUnitDiffs,
    analyzeFlexiPages,
    analyzeFlows,
    analyzeLayouts,
    analyzePermissions,
    combinePermissions,
    getApexLabelUsages,
    makeFlowUnitDiffs,
    makeLayoutUnitDiffs,
    makePermissionSetUnitDiffs,
    makeProfileUnitDiffs,
} from '../../src/analyzer/processor/Metadata';
import { MetadataFolderWorker } from '../../src/analyzer/worker';
import type {
    FlowJson,
    LayoutJson,
    PermissionSetJson,
    ProfileJson,
} from '../../src/analyzer/types';

// フォルダ単位のメタデータ (権限・ラベル・Flow・画面)。方針: docs/metadata-implementation.md 10 章
// サンプルは docs/examples/repository (run-folders.ts と同じもの)

const SAMPLES = path.resolve('docs/examples/repository');
const root = (side: 'before' | 'after') => path.join(SAMPLES, side, 'force-app/main/default');

const base = <J>(results: MetadataFileParseResult[], id: string) =>
    results.find((r) => r.result.id === id)!.result.base as J;

const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';

describe('MetadataFolderParser', () => {
    it('フォルダ単位で読み、ファイルごとに <種類>_<名前> の結果を作る。読めないファイルは error', async () => {
        const results = await PermissionSetParser.parseAll(root('after'));
        assert.deepEqual(
            results.map((r) => [r.result.id, r.dataType]),
            [
                ['permissionSet_Broken_Set', 'error'],
                ['permissionSet_Invoice_Manager', 'permissionSet'],
                ['permissionSet_Payment_Clerk', 'permissionSet'],
            ],
        );
        assert.equal(results[0]!.resolvedError[0]!.code, 'XML_SYNTAX');
    });

    it('文字列から読める (ファイルを読まない入口)。ルート要素が違えば error', () => {
        const ok = FlowParser.parseSource(
            'flows/Empty.flow-meta.xml',
            `<Flow ${NS}><label>Empty</label></Flow>`,
        );
        assert.equal(ok.dataType, 'flow');
        assert.equal(ok.result.id, 'flow_Empty');
        const wrong = FlowParser.parseSource('flows/Wrong.flow-meta.xml', `<Layout ${NS}/>`);
        assert.equal(wrong.dataType, 'error');
        assert.equal(wrong.resolvedError[0]!.code, 'UNEXPECTED_ROOT');
    });

    it('フォルダ名・保存名から parser を選ぶ', () => {
        assert.equal(findParserByFolder('/x/force-app/main/default/profiles'), ProfileParser);
        assert.equal(findParserBySaveId('permissionSetGroup_A'), PermissionSetGroupParser);
        assert.equal(findParserBySaveId('permissionSet_A'), PermissionSetParser);
        assert.equal(findParserBySaveId('Invoice__c'), undefined);
    });

    it('キーの作り方は Apex・LWC と同じ (子要素の順序が違っても objectKey は同じ)', () => {
        const a = PermissionSetParser.parseSource(
            'permissionsets/A.permissionset-meta.xml',
            `<PermissionSet ${NS}><label>A</label><description>d</description></PermissionSet>`,
        );
        const b = PermissionSetParser.parseSource(
            'permissionsets/A.permissionset-meta.xml',
            `<PermissionSet ${NS}><description>d</description><label>A</label></PermissionSet>`,
        );
        assert.equal(
            (a.result.base as PermissionSetJson).sourceKeys.objectKey,
            (b.result.base as PermissionSetJson).sourceKeys.objectKey,
        );
    });
});

describe('権限', () => {
    it('Profile はすべての要素を読み、表にない要素だけ skippedElements に残す', async () => {
        const profile = base<ProfileJson>(
            await ProfileParser.parseAll(root('after')),
            'profile_Sales',
        );
        assert.deepEqual(profile.skippedElements, ['futureSetting']);
        assert.equal(profile.loginIpRanges?.length, 2);
        assert.equal(profile.loginHours?.mondayEnd, 1200);
        assert.deepEqual(profile.categoryGroupVisibilities?.[0]?.dataCategories, [
            'Billing',
            'Invoice',
        ]);
        assert.equal(profile.profileActionOverrides?.[0]?.content, 'Invoice_Record_Page');
    });

    it('行は要素名ごとにキーで対応付け、値は 1 つずつ比べる', async () => {
        const [diff] = makePermissionSetUnitDiffs(
            (await PermissionSetParser.parseAll(root('before'))).filter(
                (r) => r.result.id === 'permissionSet_Invoice_Manager',
            ) as never,
            (await PermissionSetParser.parseAll(root('after'))).filter(
                (r) => r.result.id === 'permissionSet_Invoice_Manager',
            ) as never,
        );
        const fields = (diff!.content as { fields: Record<string, unknown> }).fields;
        const rows = fields.fieldPermissions as {
            status: string;
            value?: { field: string };
            fields?: { field: { value: string }; editable?: unknown };
        }[];
        assert.deepEqual(
            rows.map((r) => [r.status, r.value?.field ?? r.fields?.field.value]),
            [
                ['changed', 'Invoice__c.Amount__c'],
                ['removed', 'Invoice__c.Status__c'],
                ['added', 'Invoice__c.Approved__c'],
                ['added', 'Invoice__c.Missing__c'],
            ],
        );
        assert.deepEqual(rows[0]!.fields!.editable, {
            status: 'changed',
            before: false,
            after: true,
        });
    });

    it('Profile の差分 (ログインの IP・時間・レイアウトの割り当て)', async () => {
        const [diff] = makeProfileUnitDiffs(
            (await ProfileParser.parseAll(root('before'))) as never,
            (await ProfileParser.parseAll(root('after'))) as never,
        );
        assert.equal(diff!.status, 'changed');
        const fields = (
            diff!.content as unknown as { fields: Record<string, { status?: string }[]> }
        ).fields;
        assert.deepEqual(
            fields.loginIpRanges!.map((r) => r.status),
            ['unchanged', 'added'],
        );
        assert.deepEqual(
            fields.layoutAssignments!.map((r) => r.status),
            ['unchanged', 'removed', 'added'],
        );
    });

    it('権限セットグループの実際の権限は、含む権限セットの和からミュートを除いたもの', async () => {
        const analysis = analyzePermissions({
            permissionSets: (await PermissionSetParser.parseAll(root('after'))) as never,
            mutingPermissionSets: (await MutingPermissionSetParser.parseAll(
                root('after'),
            )) as never,
            permissionSetGroups: (await PermissionSetGroupParser.parseAll(root('after'))) as never,
        });
        const effective = analysis.groups[0]!.effective;
        const invoice = effective.objects.find((o) => o.object === 'Invoice__c')!;
        assert.deepEqual(
            [
                invoice.allowCreate,
                invoice.allowRead,
                invoice.allowEdit,
                invoice.allowDelete,
                invoice.modifyAllRecords,
            ],
            [true, true, true, false, false],
        );
        assert.deepEqual(
            effective.fields.find((f) => f.field === 'Invoice__c.Approved__c'),
            {
                field: 'Invoice__c.Approved__c',
                readable: true,
                editable: false,
            },
        );
        assert.ok(!effective.userPermissions.includes('ModifyAllData'));
        // 含む権限セットがない
        assert.deepEqual(
            analysis.findings
                .filter((f) => f.code === 'UNKNOWN_PERMISSION_SET')
                .map((f) => f.target),
            ['Invoice_Viewer'],
        );
    });

    it('デプロイで弾かれる矛盾と強い権限を見つける', async () => {
        const analysis = analyzePermissions({
            permissionSets: (await PermissionSetParser.parseAll(root('after'))) as never,
            profiles: (await ProfileParser.parseAll(root('after'))) as never,
        });
        const codes = analysis.findings.map((f) => `${f.code}:${f.target}`);
        assert.ok(codes.includes('OBJECT_PERMISSION_DEPENDENCY:Payment__c'));
        assert.ok(codes.includes('FIELD_EDIT_WITHOUT_READ:Invoice__c.Status__c'));
        assert.ok(codes.includes('POWERFUL_USER_PERMISSION:ModifyAllData'));
    });

    it('combinePermissions: ミュートは含む権限セットにあるものだけを外す', () => {
        const table = (objects: { object: string; allowRead: boolean }[]) => ({
            objects: objects.map((o) => ({
                allowCreate: false,
                allowEdit: false,
                allowDelete: false,
                viewAllRecords: false,
                modifyAllRecords: false,
                viewAllFields: false,
                ...o,
            })),
            fields: [],
            apexClasses: [],
            apexPages: [],
            flows: [],
            customPermissions: [],
            userPermissions: [],
            recordTypes: [],
            applications: [],
        });
        const result = combinePermissions(
            [table([{ object: 'A', allowRead: true }])],
            [
                table([
                    { object: 'A', allowRead: true },
                    { object: 'B', allowRead: true },
                ]),
            ],
        );
        assert.deepEqual(
            result.objects.map((o) => [o.object, o.allowRead]),
            [['A', false]],
        );
    });
});

describe('カスタム表示ラベル', () => {
    let tmp: string;
    before(async () => {
        tmp = await mkdtemp(path.join(os.tmpdir(), 'labels-'));
    });
    after(async () => {
        await rm(tmp, { recursive: true, force: true });
    });

    it('Apex の System.Label.<名前> / Label.<名前> を使用箇所として取り出す', async () => {
        await mkdir(path.join(tmp, 'classes'));
        const file = path.join(tmp, 'classes', 'Greeter.cls');
        await writeFile(
            file,
            'public class Greeter { public String hi() { return System.Label.Greeting + Label.Invoice_Overdue + Account.Name; } }',
        );
        const usages = getApexLabelUsages([await ApexParser.parseApexUnit(file)]);
        assert.deepEqual(
            usages.map((u) => [u.name, u.origin, u.unit]),
            [
                ['Greeting', 'apex', 'class_Greeter'],
                ['Invoice_Overdue', 'apex', 'class_Greeter'],
            ],
        );
        const analysis = analyzeCustomLabels(
            (await CustomLabelsParser.parseAll(root('after'))) as never,
            { usages },
        );
        assert.deepEqual(
            analysis.findings.map((f) => `${f.code}:${f.target}`),
            [
                'UNKNOWN_CUSTOM_LABEL:Greeting',
                'UNUSED_CUSTOM_LABEL:AccountListTitle',
                'UNUSED_CUSTOM_LABEL:Invoice_Approved',
            ],
        );
    });
});

describe('Flow', () => {
    it('接続は edges に出し、画面上の位置と Flow Builder の設定は読まない', async () => {
        const flow = base<FlowJson>(
            await FlowParser.parseAll(root('after')),
            'flow_Invoice_Status_Update',
        );
        const json = JSON.stringify(flow);
        assert.ok(!json.includes('locationX'));
        assert.ok(!json.includes('CanvasMode'));
        assert.ok(!json.includes('targetReference'));
        assert.deepEqual(
            flow.edges?.filter((e) => e.from === 'Check_Amount').map((e) => [e.to, e.edgeType]),
            [
                ['Notify', 'defaultConnector'],
                ['Notify', 'rules[Medium].connector'],
                ['Set_Status', 'rules[Large].connector'],
            ],
        );
        const update = flow.elements!.find((e) => e.name === 'Set_Status')!;
        // レコードの更新の対象は $Record (実行時に Flow が作るもの)
        assert.deepEqual(update.references, [{ refType: 'global', value: '$Record' }]);
        const decision = flow.elements!.find((e) => e.name === 'Check_Amount')!;
        assert.deepEqual(decision.references, [
            { refType: 'field', value: 'Invoice__c.Amount__c' },
        ]);
    });

    it('位置だけ変えた要素は unchanged、つなぎ替えは edges の差分に出る', async () => {
        const [, diff] = makeFlowUnitDiffs(
            (await FlowParser.parseAll(root('before'))) as never,
            (await FlowParser.parseAll(root('after'))) as never,
        );
        assert.equal(diff!.id, 'flow_Invoice_Status_Update');
        const fields = (
            diff!.content as unknown as {
                fields: Record<string, { status: string; value?: unknown; kind?: string }[]>;
            }
        ).fields;
        const status = Object.fromEntries(
            fields.elements!.map((e) => [
                (e as { value?: { name: string }; fields?: { name: { value: string } } }).value
                    ?.name ?? (e as { fields?: { name: { value: string } } }).fields?.name.value,
                e.status,
            ]),
        );
        assert.deepEqual(status, {
            Notify: 'unchanged',
            Log_Error: 'unchanged',
            Check_Amount: 'changed',
            Set_Status: 'changed',
            Orphan: 'added',
        });
        assert.deepEqual(
            fields.edges!.filter((e) => e.status !== 'unchanged').map((e) => [e.status, e.value]),
            [
                ['removed', { from: 'Notify', to: 'Set_Status', edgeType: 'connector' }],
                ['added', { from: 'Notify', to: 'Log_Error', edgeType: 'connector' }],
                [
                    'added',
                    { from: 'Check_Amount', to: 'Notify', edgeType: 'rules[Medium].connector' },
                ],
                ['added', { from: 'Set_Status', to: 'Log_Error', edgeType: 'faultConnector' }],
            ],
        );
    });

    it('到達できない要素・ない要素への参照・LWC の target を見つける', async () => {
        const analysis = analyzeFlows((await FlowParser.parseAll(root('after'))) as never, {
            lwcBundles: ['accountList'],
            lwcMeta: {
                accountList: {
                    isExposed: true,
                    targets: ['lightning__RecordPage'],
                    properties: {},
                },
            },
        });
        assert.deepEqual(analysis.findings.map((f) => `${f.code}:${f.target}`).sort(), [
            'LWC_NOT_FLOW_SCREEN:accountList',
            'NO_FAULT_PATH:Call_Status',
            'UNKNOWN_FLOW_ELEMENT:Unknown_Var',
            'UNKNOWN_LWC:missingChart',
            'UNREACHABLE_ELEMENT:Orphan',
        ]);
        assert.deepEqual(analysis.automation, [
            {
                object: 'Invoice__c',
                flows: [
                    {
                        name: 'Invoice_Status_Update',
                        triggerType: 'RecordAfterSave',
                        recordTriggerType: 'CreateAndUpdate',
                        triggerOrder: 20,
                        status: 'Active',
                    },
                ],
            },
        ]);
    });
});

describe('画面', () => {
    it('レイアウトの項目は位置付きの平らな並び。セクションをまたぐ移動は位置の変更', async () => {
        const layout = base<LayoutJson>(
            await LayoutParser.parseAll(root('after')),
            'layout_Invoice__c-Invoice Layout',
        );
        assert.equal(layout.objectApiName, 'Invoice__c');
        assert.deepEqual(layout.skippedElements, ['summaryLayout']);
        const diffs = makeLayoutUnitDiffs(
            (await LayoutParser.parseAll(root('before'))) as never,
            (await LayoutParser.parseAll(root('after'))) as never,
        );
        assert.deepEqual(
            diffs.map((d) => [d.id, d.status]),
            [
                ['layout_Account-Account Layout', 'changed'],
                ['layout_Invoice__c-Invoice Detail', 'added'],
                ['layout_Invoice__c-Invoice Layout', 'changed'],
            ],
        );
        const items = (
            diffs[2]!.content as {
                fields: {
                    items: {
                        status: string;
                        fields?: { field?: { value: string }; position?: unknown };
                    }[];
                };
            }
        ).fields.items;
        const status = items.find((i) => i.fields?.field?.value === 'Status__c')!;
        assert.deepEqual(status.fields!.position, {
            status: 'changed',
            before: { section: 'Information', column: 2, row: 1 },
            after: { section: 'Approval', column: 1, row: 1 },
        });
    });

    it('レイアウト・Lightning ページの項目と LWC を確かめる', async () => {
        const layouts = analyzeLayouts((await LayoutParser.parseAll(root('after'))) as never, {
            objects: [
                {
                    apiName: 'Account',
                    objectType: 'standard',
                    fields: [{ apiName: 'Tier__c', origin: 'metadata', valueType: 'String' }],
                    sourceKeys: { objectKey: 'o', sourceKey: 's' },
                },
            ],
        });
        // Invoice__c はオブジェクトがないので、レイアウトごとに 1 回だけ出す
        assert.deepEqual(
            layouts.findings.map((f) => `${f.code}:${f.target}`),
            [
                'UNKNOWN_FIELD:Account.Missing__c',
                'UNKNOWN_OBJECT:Invoice__c',
                'UNKNOWN_OBJECT:Invoice__c',
            ],
        );
        const pages = analyzeFlexiPages((await FlexiPageParser.parseAll(root('after'))) as never, {
            lwcBundles: ['accountList', 'accountRow'],
            lwcMeta: {
                accountList: {
                    isExposed: true,
                    targets: ['lightning__RecordPage'],
                    properties: { lightning__RecordPage: ['title', 'maxRows'] },
                },
                accountRow: { isExposed: false, targets: [], properties: {} },
            },
        });
        assert.deepEqual(
            pages.placements.map((p) => [p.lwc, p.region, p.properties]),
            [
                ['accountList', 'sidebar', ['title', 'pageSize']],
                ['accountRow', 'sidebar', []],
            ],
        );
        assert.deepEqual(
            pages.findings.map((f) => `${f.code}:${f.target}`),
            [
                'UNKNOWN_LWC_PROPERTY:accountList.pageSize',
                'LWC_NOT_EXPOSED:accountRow',
                'LWC_TARGET_MISMATCH:accountRow',
            ],
        );
    });
});

describe('MetadataFolderWorker', () => {
    let tmp: string;
    before(async () => {
        tmp = await mkdtemp(path.join(os.tmpdir(), 'metadata-folder-'));
    });
    after(async () => {
        await rm(tmp, { recursive: true, force: true });
    });

    it('1 タスク = 種類のフォルダ。保存・読み込みはファイルごと', async () => {
        const worker = new MetadataFolderWorker({ outDir: tmp, concurrency: 2 });
        const results = await worker.parseAndSaveAll(root('after'));
        assert.ok(results.every((r) => r.ok));
        // サンプルにはすべての種類のフォルダがある (オブジェクト・翻訳・LWC などのフォルダは対象外)
        assert.deepEqual(
            results.map((r) => path.basename(r.input)).sort(),
            METADATA_FOLDER_PARSERS.map((parser) => parser.spec.folder).sort(),
        );
        // 保存はファイル (単位) ごと
        const saved = results.flatMap((r) => (r.ok ? r.result : []));
        const ids = await worker.listSavedIds();
        assert.deepEqual(ids, saved.map((summary) => summary.id).sort());
        const loaded = await worker.load('flow_Account_Wizard');
        assert.equal(loaded.dataType, 'flow');
        assert.equal((await worker.loadAll()).length, ids.length);
        await worker.close();
    });
});

describe('残りの解析 (必須とレイアウト・自動化・Apex アクション・部品の並び順)', () => {
    const APEX = path.resolve('docs/examples/repository/after');

    it('項目の必須とレイアウトの behavior の食い違い', () => {
        const layout = LayoutParser.parseSource(
            'layouts/Invoice__c-Test.layout-meta.xml',
            `<Layout ${NS}><layoutSections><label>A</label><layoutColumns>
                <layoutItems><behavior>Readonly</behavior><field>Amount__c</field></layoutItems>
                <layoutItems><behavior>Required</behavior><field>Note__c</field></layoutItems>
            </layoutColumns></layoutSections></Layout>`,
        );
        const field = (apiName: string, required?: true) => ({
            apiName,
            origin: 'metadata' as const,
            valueType: 'String' as const,
            ...(required ? { required } : {}),
        });
        const analysis = analyzeLayouts([layout] as never, {
            objects: [
                {
                    apiName: 'Invoice__c',
                    objectType: 'custom',
                    fields: [field('Amount__c', true), field('Note__c'), field('Account__c', true)],
                    sourceKeys: { objectKey: 'o', sourceKey: 's' },
                },
            ],
        });
        assert.deepEqual(
            analysis.findings.map((f) => `${f.code}:${f.target}`),
            [
                'REQUIRED_FIELD_READONLY:Invoice__c.Amount__c',
                'LAYOUT_ONLY_REQUIRED:Invoice__c.Note__c',
                'REQUIRED_FIELD_NOT_ON_LAYOUT:Invoice__c.Account__c',
            ],
        );
    });

    it('Apex のトリガー・@InvocableMethod を取り出し、Flow の Apex アクションを確かめる', async () => {
        const units = await ApexParser.parseApexUnits(APEX);
        // ParserTrigger は Apex の構文のサンプル (すべてのイベント)
        assert.deepEqual(
            getApexTriggers(units).filter((t) => t.name === 'AccountTrigger'),
            [
                {
                    name: 'AccountTrigger',
                    object: 'Account',
                    events: ['after update', 'before delete'],
                    status: 'Inactive',
                    unit: 'trigger_AccountTrigger',
                },
            ],
        );
        const context = apexContextOf(units);
        assert.ok(context.apexClasses!.includes('AccountService'));
        // 構文のサンプル ParserTest は @InvocableMethod を持つ (AccountService は持たない)
        assert.deepEqual(context.invocableApexClasses, ['ParserTest']);
        const flows = analyzeFlows((await FlowParser.parseAll(root('after'))) as never, context);
        assert.deepEqual(
            flows.findings.filter((f) => f.code === 'APEX_NOT_INVOCABLE').map((f) => f.target),
            ['AccountService'],
        );
    });

    it('オブジェクトごとの自動化 (レコードトリガーフロー・Apex トリガー・入力規則)', async () => {
        const automation = analyzeAutomation({
            flows: (await FlowParser.parseAll(root('after'))) as never,
            apex: await ApexParser.parseApexUnits(APEX),
            objects: await MetadataParser.parseObjects(path.join(root('after'), 'objects')),
        });
        assert.deepEqual(
            automation.map((a) => [
                a.object,
                a.flows.map((f) => f.name),
                a.triggers.map((t) => t.name),
                a.validationRules.map((r) => `${r.name}:${r.active}`),
            ]),
            [
                ['Account', [], ['AccountTrigger', 'ParserTrigger'], ['Name_Required:true']],
                [
                    'Invoice__c',
                    ['Invoice_Status_Update'],
                    [],
                    ['Amount_Positive:true', 'Due_Date_Required:false'],
                ],
            ],
        );
    });

    it('Lightning ページのリージョンの中の並び順の変化は moved', async () => {
        const [diff] = makeFlexiPageUnitDiffs(
            (await FlexiPageParser.parseAll(root('before'))) as never,
            (await FlexiPageParser.parseAll(root('after'))) as never,
        );
        const regions = (
            diff!.content as {
                fields: { regions: { fields?: { items?: { status: string; value: string }[] } }[] };
            }
        ).fields.regions;
        assert.deepEqual(
            regions.map((r) => (r.fields?.items ?? []).map((i) => `${i.status}:${i.value}`)),
            [
                ['moved:force_highlightsPanel', 'unchanged:pathAssistant'],
                [
                    'unchanged:RecordAmountField',
                    'removed:c_accountList',
                    'added:RecordMissingField',
                ],
                [
                    'added:c_accountList',
                    'added:c_accountRow',
                    'unchanged:force_relatedListContainer',
                ],
            ],
        );
    });
});
