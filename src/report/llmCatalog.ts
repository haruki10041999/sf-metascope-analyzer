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
    '文書は構成の定義: どの部品をどう並べ、どの種類のデータ (Apex のメソッド・オブジェクトの項目・ファイルの一覧など) を見せるかを書く。個々のデータの名前 (どのクラス・メソッド・オブジェクトか) は文書に書かない。1 つずつ見せるときは for でデータの行を回し、provider の引数・where には行の値 (${m.name} など) を入れる。こうすると、どのリポジトリにもそのまま使える。',
    'レポートは 1 つの JSON の文書 (title・data・spec) で書く。spec は json-render の仕様 (root と、キー → 要素の平らな elements)。',
    'data は「名前 → { provider, args }」。ビルドが provider を実行して、結果を state の /data/<名前> に入れる。',
    'データの部品には、データを要素に直接書いてもよい (要素の "data": { "provider", "args" }。props のデータ (rows・data) は書かない)。ビルドが data に移して props をつなぐ。同じデータを複数の部品で使うときは、上の段の data に書いて $state で指す。',
    'データの部品 (DataTable・StatusSummary) の rows には、行を書かずに { "$state": "/data/<名前>" } だけを書く。数値・一覧を自分で書かない。',
    'データの部品には、受け取れる形 (shape) か provider のデータだけを渡せる (rows → DataTable・StatusSummary、matrix → Matrix、flow.diagram → FlowDiagram など。provider の「描ける部品」を見る)。',
    'DataTable で showSource: true にするときは、そのデータの宣言に withSource: true を付ける (行にソースの抜き出しが付く)。',
    '要素は type と、使う props だけを書けばよい (null を受け取れる props の省いたキーは null、children を省けば [])。値の要る props (Narrative の markdown など) は書く。入れ子で書ける: spec.root と children に、キーの代わりに要素そのもの ({ "type": "Card", "props": {…}, "children": [ {…} ] }) を書ける (キーは key か、親のキーと位置から作る)。データの部品の rows・data は "@<名前>" と書ける ({ "$state": "/data/<名前>" } と同じ)。データをすべて要素に書けば、上の段の data は省ける。平らな elements にすべて書く形もそのまま通る。',
    'AI が書くのは、Narrative の markdown (要約・リスクの説明・レビューの指摘)・見出し・Alert の文言と、どのデータをどの部品で見せるかの選択だけ。',
    'レポートの既定は「今の状態のすべて」(1 時点。行に status はない)。ドキュメント・コードの理解のためのレポートはこれで書く。',
    '差分を見るときだけ、文書に diff: true (保存した基準 → 作業ツリー) か compare ({ "from": "main" } は main...作業ツリー、{ "from": "main", "to": "HEAD" } は main...HEAD) を書く。行に status (added・removed・changed・unchanged) が付き、DataTable の onlyChanged で変わった行だけにできる。',
    'データごとに比べ方を選べる: データの宣言 (上の段の data でも、要素の data でも) に diff・compare を書くと、文書の比べ方よりそちらを使う (diff: false は今の状態だけ)。今の状態の仕様と、main からの変化を 1 つの文書に並べられる。比べ方を持つ部品の上には、比べた時点が出る。',
    'requiresComparison の provider (差分だけを返すもの) は、diff か compare がないと使えない (文書でもデータでもよい)。',
    'データの宣言の where で、行の項目の値で絞れる (for の中で { "member": "${m.owner}.${m.name}" }。値が配列ならそのどれか。a.b で入れ子の項目)。',
    'for で要素 (と子) をデータの行ごとに繰り返せる: "for": { "as": "m", "in": <データの宣言か、data の名前>, "limit": 200 }。props・要素の data・if の中の "${m.name}" を行の値に置き換える ("${m.x}" だけの文字列は配列・数値もそのまま。m.$index は 0 から、m.$number は 1 から)。入れ子の for も書ける。ビルドのときに展開し、繰り返した要素のキーは <キー>__<何行目> になる (問題の場所は <キー>[n])。上限 (既定 200) を超えた行は出さず警告する。root には書けない。',
    'if で要素 (と子) を出し分けられる: { "value": "${m.static}", "eq": true } (eq・neq・gt・gte・lt・lte・in・exists。比べ方を書かなければ空でないか)、{ "hasRows": true } (この要素のデータに行がある。文字列なら data の名前)、{ "all": [...] }・{ "any": [...] }・{ "not": {...} }。',
    '件数が多いとき (すべてのクラス・オブジェクトなど) は、for の要素に "page": { "file": "${m.name}" } を付けて 1 件 1 ページに分ける。ビルドは目次 (その場所にページへのリンク PageLink) と pages/<file>.html を書く。件数を絞って小さくはしない。',
    '文書の引数 (構成の値だけ): 文書に "params": { "depth": { "default": 2 } } と書き、題・props・データの引数・if で "${params.depth}" と使う (種類・段数・表示の切り替えなど)。ビルドに渡した値 (build_report・validate_report_spec の params) が default より優先。値も default もない引数・宣言していない引数は問題になる。個々のデータの名前を渡す使い方はしない。',
    '文章は文書の notes (キー → markdown) に書き、props で { "$note": "<キー>" } と引ける (for の中なら { "$note": "${m.owner}.${m.name}" } のように行ごとのキー)。notes にないキーは「(未記入)」になり、警告が出る。AI は for の行ごとの文章を notes に書く。',
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
