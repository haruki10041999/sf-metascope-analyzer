import { z } from 'zod';

import {
    PROVIDER_DEFINITIONS,
    type ProviderCategory,
    type ProviderDefinition,
    type ProviderShape,
} from '../analyzer/report/registry';

import {
    REPORT_COMPONENTS,
    REPORT_DATA_BINDINGS,
    type ReportComponentName,
    acceptsData,
} from './catalog';
import { ReportDocument } from './document';

// LLM 向けのカタログ (docs/implementation-roadmap.md 4.2)。
// コンポーネントのカタログ (catalog.ts) と provider の登録表 (registry.ts) から作る。手で書いた一覧を別に持たない。
// json-render の catalog.prompt() は JSON Patch を少しずつ出す形の説明なので使わず、文書をまとめて書く形の説明を作る

export const REPORT_CATALOG_VERSION = 1;

type JsonSchema = Record<string, unknown>;

export type ComponentEntry = {
    name: string;
    description: string;
    /** データを受け取るプロパティ ({ "$state": "/data/<名前>" } で指す) */
    dataProps: string[];
    /** 受け取れるデータ (出力の形と、provider の名前) */
    accepts?: { shapes?: string[]; providers?: string[] };
    props: JsonSchema;
};

export type ProviderEntry = {
    name: string;
    description: string;
    category: ProviderCategory;
    /** 出力の形 (rows なら DataTable・StatusSummary で描ける) */
    shape: ProviderShape;
    /** このデータを描ける部品 */
    components: string[];
    args: JsonSchema;
    output: JsonSchema;
    example?: unknown;
    /** true なら、比べる 2 つの時点 (文書の diff / compare) が要る */
    requiresComparison?: true;
};

export type ReportCatalog = {
    version: number;
    rules: string[];
    documentSchema: JsonSchema;
    components: ComponentEntry[];
    providers: ProviderEntry[];
};

/** 文書の書き方の決まり (検証: src/report/document.ts) */
export const REPORT_RULES = [
    'レポートは 1 つの JSON の文書 (title・data・spec) で書く。spec は json-render の仕様 (root と、キー → 要素の平らな elements)。',
    'data は「名前 → { provider, args }」。ビルドが provider を実行して、結果を state の /data/<名前> に入れる。',
    'データの部品 (DataTable・StatusSummary) の rows には、行を書かずに { "$state": "/data/<名前>" } だけを書く。数値・一覧を自分で書かない。',
    'データの部品には、受け取れる形 (shape) か provider のデータだけを渡せる (rows → DataTable・StatusSummary、matrix → Matrix、flow.diagram → FlowDiagram など。provider の「描ける部品」を見る)。',
    'DataTable で showSource: true にするときは、そのデータの宣言に withSource: true を付ける (行にソースの抜き出しが付く)。',
    'どの要素も type・props・children を持つ (子がなければ children は [])。props は部品のスキーマのとおりに、すべてのキーを書く (使わないものは null)。',
    'AI が書くのは、Narrative の markdown (要約・リスクの説明・レビューの指摘)・見出し・Alert の文言と、どのデータをどの部品で見せるかの選択だけ。',
    'レポートの既定は「今の状態のすべて」(1 時点。行に status はない)。ドキュメント・コードの理解のためのレポートはこれで書く。',
    '差分を見るときだけ、文書に diff: true (保存した基準 → 作業ツリー) か compare ({ "from": "main" } は main...作業ツリー、{ "from": "main", "to": "HEAD" } は main...HEAD) を書く。行に status (added・removed・changed・unchanged) が付き、DataTable の onlyChanged で変わった行だけにできる。',
    'requiresComparison の provider (差分だけを返すもの) は、diff か compare がないと使えない。',
];

const jsonSchemaOf = (schema: z.ZodType, io: 'input' | 'output'): JsonSchema => {
    const { $schema: _schema, ...rest } = z.toJSONSchema(schema, { io, unrepresentable: 'any' });
    return rest;
};

/** LLM 向けのカタログを作る */
export const buildReportCatalog = (): ReportCatalog => ({
    version: REPORT_CATALOG_VERSION,
    rules: REPORT_RULES,
    documentSchema: jsonSchemaOf(ReportDocument, 'input'),
    components: Object.entries(REPORT_COMPONENTS).map(([name, component]) => {
        const binding = REPORT_DATA_BINDINGS[name as ReportComponentName];
        return {
            name,
            description: component.description,
            dataProps: binding ? [binding.prop] : [],
            ...(binding
                ? {
                      accepts: {
                          ...(binding.shapes ? { shapes: binding.shapes } : {}),
                          ...(binding.providers ? { providers: binding.providers } : {}),
                      },
                  }
                : {}),
            props: jsonSchemaOf(component.props, 'input'),
        };
    }),
    providers: Object.entries(PROVIDER_DEFINITIONS).map(([name, definition]) => {
        const def = definition as ProviderDefinition;
        return {
            name,
            description: def.description,
            category: def.category,
            shape: def.shape,
            components: Object.entries(REPORT_DATA_BINDINGS)
                .filter(([, binding]) => acceptsData(binding, name, def.shape))
                .map(([component]) => component),
            args: jsonSchemaOf(def.args, 'input'),
            output: jsonSchemaOf(def.output, 'output'),
            ...(def.example !== undefined ? { example: def.example } : {}),
            ...(def.requiresComparison ? { requiresComparison: true as const } : {}),
        };
    }),
});

const code = (value: unknown) => `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;

/** 部品 1 つの説明 (Markdown) */
export const componentMarkdown = (component: ComponentEntry): string =>
    [
        `### ${component.name}`,
        '',
        component.description,
        ...(component.dataProps.length
            ? [
                  '',
                  `データを受け取るプロパティ: ${component.dataProps.map((p) => `\`${p}\``).join('・')}`,
              ]
            : []),
        '',
        'props:',
        '',
        code(component.props),
    ].join('\n');

/** provider 1 つの説明 (Markdown) */
export const providerMarkdown = (provider: ProviderEntry): string =>
    [
        `### ${provider.name}`,
        '',
        provider.description,
        '',
        `分類: ${provider.category}。出力の形: ${provider.shape}。描ける部品: ${provider.components.join('・') || '—'}${provider.requiresComparison ? '。**比べる時点が要る** (文書の diff か compare)' : ''}`,
        '',
        'args:',
        '',
        code(provider.args),
        ...(provider.example !== undefined ? ['', '例:', '', code(provider.example)] : []),
        '',
        '出力:',
        '',
        code(provider.output),
    ].join('\n');

/** カタログ全体 (Markdown。LLM が読む向け) */
export const reportCatalogMarkdown = (catalog: ReportCatalog = buildReportCatalog()): string =>
    [
        '# レポートのカタログ',
        '',
        `版: ${catalog.version}。このファイルは src/report/llmCatalog.ts から作ったもの (npm run catalog)。手で直さない。`,
        '',
        '## 書き方の決まり',
        '',
        ...catalog.rules.map((rule) => `- ${rule}`),
        '',
        '## 部品の一覧',
        '',
        '| 部品 | 説明 | データ |',
        '| --- | --- | --- |',
        ...catalog.components.map(
            (c) => `| \`${c.name}\` | ${c.description} | ${c.dataProps.join('・') || '—'} |`,
        ),
        '',
        '## provider の一覧',
        '',
        '| provider | 形 | 描ける部品 | 説明 |',
        '| --- | --- | --- | --- |',
        ...catalog.providers.map(
            (p) =>
                `| \`${p.name}\` | ${p.shape} | ${p.components.join('・') || '—'} | ${p.description}${p.requiresComparison ? ' (比べる時点が要る)' : ''} |`,
        ),
        '',
        '## 文書のスキーマ',
        '',
        code(catalog.documentSchema),
        '',
        '## 部品',
        '',
        ...catalog.components.map(componentMarkdown).flatMap((text) => [text, '']),
        '## provider',
        '',
        ...catalog.providers.map(providerMarkdown).flatMap((text) => [text, '']),
    ].join('\n');

/**
 * カタログの概要 (書き方の決まりと、部品・provider の一覧だけ。MCP の list_report_components・リソースで渡す)。
 * 詳しい説明 (props・引数・出力のスキーマ) は componentMarkdown・providerMarkdown を名前で引く
 */
export const reportCatalogSummaryMarkdown = (
    catalog: ReportCatalog = buildReportCatalog(),
): string =>
    [
        '# レポートのカタログ (概要)',
        '',
        '## 書き方の決まり',
        '',
        ...catalog.rules.map((rule) => `- ${rule}`),
        '',
        '## 部品',
        '',
        '| 部品 | 説明 | データ |',
        '| --- | --- | --- |',
        ...catalog.components.map(
            (c) => `| \`${c.name}\` | ${c.description} | ${c.dataProps.join('・') || '—'} |`,
        ),
        '',
        '## provider',
        '',
        '| provider | 形 | 描ける部品 | 説明 |',
        '| --- | --- | --- | --- |',
        ...catalog.providers.map(
            (p) =>
                `| \`${p.name}\` | ${p.shape} | ${p.components.join('・') || '—'} | ${p.description}${p.requiresComparison ? ' (比べる時点が要る)' : ''} |`,
        ),
        '',
        '部品の props・provider の引数と出力のスキーマは、describe_report_component・describe_report_provider (またはリソースの metascope://catalog/components/<名前>・metascope://catalog/providers/<名前>) で見る。文書の JSON Schema は metascope://schema/report-document。',
    ].join('\n');

/** 名前で部品を引く */
export const findCatalogComponent = (name: string, catalog: ReportCatalog = buildReportCatalog()) =>
    catalog.components.find((component) => component.name === name);

/** 名前で provider を引く */
export const findCatalogProvider = (name: string, catalog: ReportCatalog = buildReportCatalog()) =>
    catalog.providers.find((provider) => provider.name === name);
