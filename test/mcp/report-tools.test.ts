import assert from 'node:assert/strict';
import { closeAllStoreBackends } from '../../src/analyzer/unit';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { repositoryOf } from '../../docs/examples/paths';
import { RepositoryProcessor } from '../../src/analyzer/unit/processor';
import { REPORT_META_KEY, REPORT_UI_URI, registerAppResources } from '../../src/mcp/appResources';
import { registerCatalogResources } from '../../src/mcp/catalogResources';
import { registerReportPrompts } from '../../src/mcp/prompts';
import { registerReportTools } from '../../src/mcp/reportTools';
import {
    apexSpecificationTemplate,
    impactAnalysisTemplate,
    lwcOverviewTemplate,
    metadataInventoryTemplate,
    objectDefinitionTemplate,
    permissionOverviewTemplate,
    releaseReviewTemplate,
    systemOverviewTemplate,
    translationOverviewTemplate,
} from '../../src/report/templates';
import {
    analyticsOverviewTemplate,
    automationOverviewTemplate,
    featureOverviewTemplate,
    integrationOverviewTemplate,
    securityOverviewTemplate,
    uiOverviewTemplate,
} from '../../src/report/domainTemplates';

// レポートの MCP のツール・リソース・プロンプト (docs/implementation-roadmap.md の R3)

type Handler = (...args: unknown[]) => Promise<unknown>;

/** register* の呼び出しを集めるだけのサーバー */
const fakeServer = () => {
    const tools = new Map<string, Handler>();
    const resources = new Map<string, { target: unknown; handler: Handler }>();
    const prompts = new Map<string, Handler>();
    /** プロンプトの引数 (argsSchema) */
    const promptArgs = new Map<string, Record<string, unknown>>();
    const server = {
        registerTool: (name: string, _config: unknown, handler: Handler) =>
            tools.set(name, handler),
        registerResource: (name: string, target: unknown, _config: unknown, handler: Handler) =>
            resources.set(name, { target, handler }),
        registerPrompt: (
            name: string,
            config: { argsSchema?: Record<string, unknown> },
            handler: Handler,
        ) => {
            promptArgs.set(name, config.argsSchema ?? {});
            prompts.set(name, handler);
        },
    } as unknown as McpServer;
    return { server, tools, resources, prompts, promptArgs };
};

const textOf = (result: unknown) => (result as { content: { text: string }[] }).content[0]!.text;

const call = async (
    tools: Map<string, Handler>,
    name: string,
    args: Record<string, unknown> = {},
) => textOf(await tools.get(name)!(args));

const json = async (
    tools: Map<string, Handler>,
    name: string,
    args: Record<string, unknown> = {},
) => JSON.parse(await call(tools, name, args));

describe('レポートの MCP のツール', () => {
    const { server, tools, resources, prompts, promptArgs } = fakeServer();
    let tmp: string;
    let template: string;

    before(async () => {
        tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'report-tools-'));
        template = path.join(tmp, 'template.html');
        await fs.writeFile(
            template,
            '<html><head><script type="application/json" id="metascope-report">null</script></head></html>',
        );
        const processor = await RepositoryProcessor.create(
            path.join(tmp, 'saved'),
            repositoryOf('after'),
        );
        registerReportTools(server, processor, {
            reportDirectory: path.join(tmp, 'reports'),
            templatePath: template,
        });
        registerCatalogResources(server);
        registerAppResources(server, { templatePath: template });
        registerReportPrompts(server);
    });
    after(async () => {
        closeAllStoreBackends();
        await fs.rm(tmp, { recursive: true, force: true });
    });

    it('カタログ: 概要 (決まりと一覧) と、名前で引く詳しい説明', async () => {
        const summary = await call(tools, 'list_report_components');
        assert.match(summary, /## 書き方の決まり/);
        assert.match(summary, /`DataTable`/);
        assert.match(summary, /`flow\.interface`/);
        assert.match(
            await call(tools, 'describe_report_component', { name: 'DataTable' }),
            /props:/,
        );
        assert.match(
            await call(tools, 'describe_report_provider', { name: 'flow.interface' }),
            /出力の形: rows/,
        );
        const unknown = await json(tools, 'describe_report_component', { name: 'Chart' });
        assert.ok(unknown.components.includes('DataTable'));
        const providers = await json(tools, 'list_report_providers');
        assert.ok(
            providers.some(
                (p: { name: string; shape: string }) =>
                    p.name === 'flow.interface' && p.shape === 'rows',
            ),
        );
    });

    it('get_report_data: 引数を登録表の zod で確かめる', async () => {
        const invalid = await json(tools, 'get_report_data', {
            provider: 'dependency.dependents',
            args: {},
        });
        assert.equal(invalid.error, 'Invalid args for dependency.dependents');
        assert.equal(invalid.issues[0].path, 'target');
        const rows = await json(tools, 'get_report_data', {
            provider: 'dependency.dependents',
            args: { target: 'field:Invoice__c.Amount__c' },
        });
        assert.ok(rows.length > 0);
    });

    it('list_note_keys: for の行で決まるキーも展開して数え、書いてあるか・使っていないキーを返す', async () => {
        const document = {
            ...apexSpecificationTemplate(),
            notes: { AccountService: '説明', NotUsed: 'x' },
        };
        const result = await json(tools, 'list_note_keys', { document });
        assert.equal(result.ok, true, JSON.stringify(result.issues));
        const keys = result.keys as { key: string; written: boolean; elements: string[] }[];
        const service = keys.find((k) => k.key === 'AccountService');
        assert.equal(service?.written, true);
        assert.ok(service!.elements.length > 0);
        assert.ok(keys.some((k) => !k.written));
        assert.deepEqual(result.unused, ['NotUsed']);
    });

    it('validate_report_spec と build_report: 雛形はそのまま通り、HTML を書く', async () => {
        // 差分の雛形 (release_review。diff: true) は保存した基準と比べる
        await json(tools, 'save_baseline', { reload: false });
        for (const document of [
            systemOverviewTemplate(),
            objectDefinitionTemplate(),
            apexSpecificationTemplate(),
            lwcOverviewTemplate(),
            translationOverviewTemplate(),
            metadataInventoryTemplate(),
            metadataInventoryTemplate(['customTab', 'role']),
            automationOverviewTemplate(),
            securityOverviewTemplate(),
            uiOverviewTemplate(),
            integrationOverviewTemplate(),
            analyticsOverviewTemplate(),
            permissionOverviewTemplate(),
            releaseReviewTemplate(),
            impactAnalysisTemplate(),
            featureOverviewTemplate(),
        ]) {
            const validated = await json(tools, 'validate_report_spec', { document });
            assert.equal(validated.ok, true, JSON.stringify(validated.issues));
        }
        const built = await json(tools, 'build_report', {
            document: releaseReviewTemplate(),
            fileName: 'release review',
        });
        assert.equal(built.ok, true, JSON.stringify(built.issues));
        assert.equal(path.basename(built.path), 'release-review.html');
        assert.match(await fs.readFile(built.path, 'utf8'), /リリース前のレビュー/);
        // 問題があれば HTML を作らず、問題を返す
        const broken = await json(tools, 'build_report', {
            document: { ...releaseReviewTemplate(), data: {} },
        });
        assert.equal(broken.ok, false);
        assert.ok(broken.issues.some((i: { message: string }) => /Unknown data/.test(i.message)));
    });

    it('部品に書いたデータは、データごとに比べ方を選べる (比べ方ごとに入力を読む)', async () => {
        await json(tools, 'save_baseline', { reload: false });
        const table = (data: Record<string, unknown>) => ({
            type: 'DataTable',
            props: { columns: null, caption: null, onlyChanged: null },
            children: [],
            data,
        });
        const document = {
            title: '部品ごとのデータ',
            data: {},
            spec: {
                root: 'page',
                elements: {
                    page: {
                        type: 'Stack',
                        props: {
                            direction: 'vertical',
                            gap: 'md',
                            align: null,
                            justify: null,
                            className: null,
                        },
                        children: ['now', 'changes'],
                    },
                    now: table({ provider: 'apex.interface' }),
                    changes: table({ provider: 'permission.diffs', diff: true }),
                },
            },
        };
        const validated = await json(tools, 'validate_report_spec', { document });
        assert.equal(validated.ok, true, JSON.stringify(validated.issues));
        const result = (await tools.get('build_report')!({ document })) as {
            _meta?: Record<string, { spec: { state: { compared?: Record<string, string> } } }>;
        };
        assert.deepEqual(result._meta?.[REPORT_META_KEY]?.spec.state.compared, {
            changes: '保存した基準 → 作業ツリー',
        });
        // ない git の範囲は、ツールのエラーにせず問題として返す
        const broken = await json(tools, 'validate_report_spec', {
            document: {
                ...document,
                spec: {
                    root: 'now',
                    elements: {
                        now: table({
                            provider: 'apex.interface',
                            compare: { from: 'no-such-branch' },
                        }),
                    },
                },
            },
        });
        assert.equal(broken.ok, false);
    });

    it('文書の引数 (params。構成の値) をツールで渡せる', async () => {
        const document = {
            title: '呼び出し (${params.depth} 段)',
            params: { depth: { default: 1 } },
            data: {},
            spec: {
                root: 'calls',
                elements: {
                    calls: {
                        type: 'SequenceDiagram',
                        props: { start: null },
                        children: [],
                        data: { provider: 'apex.callFlow', args: { depth: '${params.depth}' } },
                    },
                },
            },
        };
        const result = (await tools.get('build_report')!({
            document,
            params: { depth: 3 },
        })) as { _meta?: Record<string, { title: string }> };
        assert.equal(result._meta?.[REPORT_META_KEY]?.title, '呼び出し (3 段)');
        const unknown = await json(tools, 'validate_report_spec', { document, params: { x: 1 } });
        assert.equal(unknown.ok, false);
        assert.equal(unknown.issues[0].path, 'params.x');
    });

    it('既定は今の状態のすべて (status なし)。差分は diff / compare のときだけ', async () => {
        await json(tools, 'save_baseline', { reload: false });
        const current = await json(tools, 'get_report_data', { provider: 'apex.interface' });
        assert.ok(current.length > 0);
        assert.ok(current.every((row: { status?: string }) => row.status === undefined));
        // onlyChanged は比べたときだけ効く (1 時点ならすべて)
        const onlyChanged = await json(tools, 'get_report_data', {
            provider: 'apex.interface',
            args: { onlyChanged: true },
        });
        assert.equal(onlyChanged.length, current.length);
        const compared = await json(tools, 'get_report_data', {
            provider: 'apex.interface',
            diff: true,
        });
        assert.equal(compared.length, current.length);
        assert.ok(compared.every((row: { status?: string }) => row.status === 'unchanged'));
        // 差分だけを返す provider は、比べる時点がなければ問題にする
        const missing = await json(tools, 'get_report_data', { provider: 'permission.diffs' });
        assert.match(missing.error, /needs two points to compare/);
        assert.ok(
            Array.isArray(
                await json(tools, 'get_report_data', { provider: 'permission.diffs', diff: true }),
            ),
        );
        const document = { ...releaseReviewTemplate(), diff: undefined };
        const validated = await json(tools, 'validate_report_spec', { document });
        assert.equal(validated.ok, false);
        assert.ok(
            validated.issues.some((i: { path: string }) => i.path === 'data.permissions.provider'),
        );
        // ツールの diff でも比べられる
        assert.equal(
            (await json(tools, 'validate_report_spec', { document, diff: true })).ok,
            true,
        );
    });

    it('リソース: 概要・文書の JSON Schema・部品ごとの説明', async () => {
        const read = async (name: string, uri: string, variables?: Record<string, string>) =>
            (
                (await resources.get(name)!.handler(new URL(uri), variables)) as {
                    contents: { text: string }[];
                }
            ).contents[0]!.text;
        assert.match(await read('report-catalog', 'metascope://catalog'), /書き方の決まり/);
        const schema = JSON.parse(
            await read('report-document-schema', 'metascope://schema/report-document'),
        );
        // data はすべて要素に書けば省ける (省略と短い書き方)
        assert.deepEqual(schema.required, ['title', 'spec']);
        assert.ok(schema.$defs.element);
        assert.match(
            await read('report-component', 'metascope://catalog/components/Narrative', {
                name: 'Narrative',
            }),
            /### Narrative/,
        );
    });

    // release_review は比べる時点が要るので、ツールの diff で確かめる
    const json_ = (name: string, document: unknown) =>
        json(tools, 'validate_report_spec', {
            document,
            ...(name === 'release_review' ? { diff: true } : {}),
        });

    it('プロンプト: 手順と雛形を返す', async () => {
        const result = (await prompts.get('impact_analysis')!({})) as {
            messages: { content: { text: string } }[];
        };
        const text = result.messages[0]!.content.text;
        assert.match(text, /validate_report_spec/);
        assert.match(text, /"provider": "dependency.impact"/);
        // 個々のデータの名前は書かない (起点は変わった単位から自動で決まる)
        assert.doesNotMatch(text, /apexClass:/);
    });

    it('プロンプトの引数に個々のデータ (クラス・オブジェクト・起点) を取らない', () => {
        for (const name of [
            'object_definition',
            'apex_specification',
            'lwc_overview',
            'translation_overview',
            'impact_analysis',
            'feature_overview',
        ]) {
            assert.deepEqual(Object.keys(promptArgs.get(name) ?? {}), [], name);
        }
    });

    it('プロンプト: 登録したすべての雛形が、文書の雛形を返し、そのまま検証を通る', async () => {
        assert.ok(prompts.size >= 15);
        for (const [name, handler] of prompts) {
            const result = (await handler({})) as { messages: { content: { text: string } }[] };
            const text = result.messages[0]!.content.text;
            const json = text.slice(text.indexOf('```json') + 7, text.lastIndexOf('```'));
            const validated = await json_(name, JSON.parse(json));
            assert.equal(validated.ok, true, `${name}: ${JSON.stringify(validated.issues)}`);
        }
    });

    it('MCP Apps: build_report の結果の _meta にレポート本体を入れ、画面のリソースは viewer の HTML を返す', async () => {
        const result = (await tools.get('build_report')!({
            document: impactAnalysisTemplate(),
        })) as { _meta?: Record<string, { title: string; spec: { state: unknown } }> };
        const report = result._meta?.[REPORT_META_KEY];
        assert.ok(report);
        assert.equal(report.title, '変更の影響の調査');
        assert.ok(report.spec.state);
        const read = (await resources.get('Metascope report')!.handler(new URL(REPORT_UI_URI))) as {
            contents: { mimeType: string; text: string }[];
        };
        assert.match(read.contents[0]!.mimeType, /^text\/html;profile=mcp-app/);
        assert.match(read.contents[0]!.text, /metascope-report/);
    });

    it('save_baseline: 今の状態を基準として保存する', async () => {
        assert.deepEqual(await json(tools, 'save_baseline'), { ok: true });
    });
});
