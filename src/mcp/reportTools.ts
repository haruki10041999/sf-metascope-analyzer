import path from 'node:path';

import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import {
    PROVIDER_DEFINITIONS,
    type ProviderDefinition,
    comparisonRequiredMessage,
    isReportProviderName,
    providerDefinitionOf,
    requiresComparison,
    runReportProvider,
} from '../analyzer/report';
import { CompareRange } from '../analyzer/unit/gitRange';
import type { RepositoryProcessor } from '../analyzer/unit/processor';
import { resolveReport, writeReportHtml } from '../builder/reportBuilder';
import {
    buildReportCatalog,
    componentMarkdown,
    findCatalogComponent,
    findCatalogProvider,
    providerMarkdown,
    reportCatalogSummaryMarkdown,
} from '../report/llmCatalog';

import { REPORT_META_KEY, REPORT_UI_URI } from './appResources';
import { type ProcessorSource, processorGetter } from './context';

// レポートの MCP のツール (docs/implementation-roadmap.md 4.5)。
// カタログ (一覧・詳しい説明) → データの取得 → 文書の検証 → HTML の作成、の流れ。
// 説明・スキーマはすべて登録表 (provider: analyzer/report/registry.ts、部品: report/catalog.ts) から作る。
// AI に渡すデータなので、機密になりうる値は必ず伏せる (report/mask.ts。runReportProvider の既定)

const text = (value: unknown) => ({
    content: [
        {
            type: 'text' as const,
            text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
        },
    ],
});

const reloadSchema = z
    .boolean()
    .optional()
    .describe('true なら、リポジトリ (作業ツリー) を読み直してから実行する');

const compareSchema = CompareRange.optional().describe(
    'git の範囲で比べるとき ({ "from": "main" } は main...作業ツリー、{ "from": "main", "to": "HEAD" } は main...HEAD)。diff より優先する',
);

const diffSchema = z
    .boolean()
    .optional()
    .describe(
        'true なら、保存した基準 (save_baseline) と作業ツリーを比べる (各行に status)。省くと今の状態のすべて (文書の diff があればそれ)',
    );

/**
 * 比べる時点。既定は今の状態だけ (1 時点。すべてを返し、status は付けない)。
 * git の範囲はツールの compare → 文書の compare、保存した基準との比較はツールの diff → 文書の diff の順に使う
 */
const comparedInputOf = async (
    processor: RepositoryProcessor,
    compare: unknown,
    diff: boolean | undefined,
    document?: unknown,
) => {
    const fromDocument = document as { compare?: unknown; diff?: unknown } | undefined;
    const documentRange = CompareRange.safeParse(fromDocument?.compare);
    const range =
        (compare as CompareRange | undefined) ??
        (documentRange.success ? documentRange.data : undefined);
    return processor.getComparedInput(range, {
        diff: diff ?? fromDocument?.diff === true,
    });
};

const toError = (error: unknown): Error =>
    error instanceof Error ? error : new Error(String(error));

/** 範囲の誤り (ないリビジョン・git でないフォルダ) は、ツールのエラーにせず問題として返す */
const compareIssue = (error: unknown) =>
    text({
        ok: false,
        issues: [
            { path: 'compare', message: error instanceof Error ? error.message : String(error) },
        ],
    });

/** 文書 (レポートの title・data・spec)。形は validate_report_spec・build_report が確かめる */
const documentSchema = z
    .record(z.string(), z.unknown())
    .describe(
        'レポートの文書 ({ title, data, spec })。形は metascope://schema/report-document、書き方は list_report_components の決まり',
    );

/** 文書のデータの件数 (データの名前 → 行の数。行の並びでなければ null) */
const dataSummaryOf = (state: Record<string, unknown>) =>
    Object.fromEntries(
        Object.entries((state.data ?? {}) as Record<string, unknown>).map(([name, value]) => [
            name,
            Array.isArray(value) ? value.length : null,
        ]),
    );

/** ファイル名に使えない文字を除く */
const toFileName = (name: string) =>
    name
        .trim()
        .replace(/[\\/:*?"<>|\s]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'report';

export type ReportToolOptions = {
    /** HTML を書くフォルダ (既定は <保存先>/reports) */
    reportDirectory?: string;
    /** 事前にビルドした viewer の HTML (既定は dist/viewer/report/index.html。テストで差し替える) */
    templatePath?: string;
};

export const registerReportTools = (
    server: McpServer,
    source: ProcessorSource,
    options: ReportToolOptions = {},
): void => {
    const processorOf = processorGetter(source);

    server.registerTool(
        'list_report_components',
        {
            description:
                'レポートの書き方の決まりと、部品・provider の一覧を返します (レポートを書く前に最初に読む)。詳しい説明は describe_report_component・describe_report_provider',
            inputSchema: {},
        },
        async () => text(reportCatalogSummaryMarkdown()),
    );

    server.registerTool(
        'describe_report_component',
        {
            description: 'レポートの部品の説明と props のスキーマを返します',
            inputSchema: { name: z.string().min(1).describe('部品の名前 (DataTable など)') },
        },
        async ({ name }) => {
            const catalog = buildReportCatalog();
            const component = findCatalogComponent(name, catalog);
            return text(
                component
                    ? componentMarkdown(component)
                    : {
                          error: `Unknown component: ${name}`,
                          components: catalog.components.map((c) => c.name),
                      },
            );
        },
    );

    server.registerTool(
        'list_report_providers',
        {
            description:
                'レポートのデータの provider の一覧 (名前・分類・出力の形・説明) を返します。データは get_report_data で取得します',
            inputSchema: {},
        },
        async () =>
            text(
                Object.entries(PROVIDER_DEFINITIONS).map(([name, definition]) => {
                    const def = definition as ProviderDefinition;
                    return {
                        name,
                        category: def.category,
                        shape: def.shape,
                        description: def.description,
                        ...(def.requiresComparison ? { requiresComparison: true } : {}),
                    };
                }),
            ),
    );

    server.registerTool(
        'describe_report_provider',
        {
            description: 'provider の説明と、引数・出力のスキーマ・例の引数を返します',
            inputSchema: {
                name: z.string().min(1).describe('provider の名前 (flow.interface など)'),
            },
        },
        async ({ name }) => {
            const provider = findCatalogProvider(name);
            return text(
                provider
                    ? providerMarkdown(provider)
                    : {
                          error: `Unknown provider: ${name}`,
                          providers: Object.keys(PROVIDER_DEFINITIONS),
                      },
            );
        },
    );

    server.registerTool(
        'get_report_data',
        {
            description:
                'レポートのデータを provider の名前で取得します。既定は今の状態のすべてです。diff: true で保存した基準からの差分、compare で git の範囲の差分 (各行の status) を返します。AI が文章を考えるための材料です (レポートに数値を書き写さず、文書の data で宣言してください)。機密になりうる値 (指定ログイン情報の URL など) は伏せます',
            inputSchema: {
                provider: z.string().min(1),
                args: z.record(z.string(), z.unknown()).optional(),
                diff: diffSchema,
                compare: compareSchema,
                reload: reloadSchema,
            },
        },
        async ({ provider, args, diff, compare, reload }) => {
            if (!isReportProviderName(provider)) {
                return text({
                    error: `Unknown provider: ${provider}`,
                    providers: Object.keys(PROVIDER_DEFINITIONS),
                });
            }
            const parsed = providerDefinitionOf(provider).args.safeParse(args ?? {});
            if (!parsed.success) {
                return text({
                    error: `Invalid args for ${provider}`,
                    issues: parsed.error.issues.map((issue) => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                    })),
                });
            }
            const processor = await processorOf();
            if (reload) await processor.reset();
            const compared = await comparedInputOf(processor, compare, diff).catch(
                (error: unknown) => toError(error),
            );
            if (compared instanceof Error) return compareIssue(compared);
            const { input } = compared;
            if (requiresComparison(provider) && !input.before) {
                return text({ error: comparisonRequiredMessage(provider) });
            }
            return text(runReportProvider(provider, input, args));
        },
    );

    server.registerTool(
        'validate_report_spec',
        {
            description:
                'レポートの文書を確かめます (形・部品・provider と引数・データの指し方・props)。provider も実行し、データの件数を返します',
            inputSchema: {
                document: documentSchema,
                diff: diffSchema,
                compare: compareSchema,
                reload: reloadSchema,
            },
        },
        async ({ document, diff, compare, reload }) => {
            const processor = await processorOf();
            if (reload) await processor.reset();
            const comparedInput = await comparedInputOf(processor, compare, diff, document).catch(
                (error: unknown) => toError(error),
            );
            if (comparedInput instanceof Error) return compareIssue(comparedInput);
            const { input, compared } = comparedInput;
            const resolved = resolveReport(document, input, { compared });
            return text(
                resolved.ok
                    ? {
                          ok: true,
                          data: dataSummaryOf(resolved.report.spec.state),
                          ...(resolved.warnings ? { warnings: resolved.warnings } : {}),
                      }
                    : { ok: false, issues: resolved.issues },
            );
        },
    );

    // MCP Apps に対応したクライアントでは、結果のレポートを画面 (ui://metascope/report.html) で見せる (appResources.ts)
    registerAppTool(
        server,
        'build_report',
        {
            description:
                'レポートの文書を確かめて、1 つの HTML にします (書いたファイルのパスを返します)。問題があれば HTML は作らず、問題を返します。MCP Apps に対応したクライアントでは、レポートをその場で表示します',
            _meta: { ui: { resourceUri: REPORT_UI_URI } },
            inputSchema: {
                document: documentSchema,
                fileName: z
                    .string()
                    .optional()
                    .describe('HTML のファイル名 (拡張子なし)。既定は文書の title'),
                diff: diffSchema,
                compare: compareSchema,
                reload: reloadSchema,
            },
        },
        async ({ document, fileName, diff, compare, reload }) => {
            const processor = await processorOf();
            if (reload) await processor.reset();
            const comparedInput = await comparedInputOf(processor, compare, diff, document).catch(
                (error: unknown) => toError(error),
            );
            if (comparedInput instanceof Error) return compareIssue(comparedInput);
            const { input, compared } = comparedInput;
            const resolved = resolveReport(document, input, { compared });
            if (!resolved.ok) return text({ ok: false, issues: resolved.issues });
            const directory = options.reportDirectory ?? path.join(processor.savingRoot, 'reports');
            const output = path.join(
                directory,
                `${toFileName(fileName ?? resolved.report.title)}.html`,
            );
            try {
                const written = await writeReportHtml(
                    resolved.report,
                    output,
                    options.templatePath,
                );
                const summary = {
                    ok: true,
                    path: written,
                    data: dataSummaryOf(resolved.report.spec.state),
                    ...(resolved.warnings ? { warnings: resolved.warnings } : {}),
                };
                // レポート本体 (仕様とデータ) は画面だけに渡す (_meta。モデルの文脈を大きくしない)
                return {
                    ...text(summary),
                    structuredContent: summary,
                    _meta: { [REPORT_META_KEY]: resolved.report },
                };
            } catch (error) {
                return text({ ok: false, issues: [{ path: '', message: String(error) }] });
            }
        },
    );

    server.registerTool(
        'save_baseline',
        {
            description:
                '今のリポジトリの状態を、次に比べる基準 (before) として保存します。以後のデータの status は、この時点からの変化になります',
            inputSchema: {
                reload: z
                    .boolean()
                    .optional()
                    .describe(
                        'false なら読み直さずに、最後に読んだ状態を保存する (既定は読み直す)',
                    ),
            },
        },
        async ({ reload }) => {
            const processor = await processorOf();
            if (reload ?? true) await processor.reset();
            await processor.save();
            return text({ ok: true });
        },
    );
};
