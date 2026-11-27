import { type Spec, resolveElementProps, validateSpec } from '@json-render/core';
import { z } from 'zod';

import { CompareRange } from '../analyzer/unit/gitRange';

import { REPORT_COMPONENTS, REPORT_DATA_BINDINGS, type ReportComponentName } from './catalog';
import { expandShorthand } from './shorthand';

// レポートの文書 (docs/implementation-roadmap.md 4.1)。
// json-render の仕様 (spec) に、データの宣言 (data: 名前 → provider と引数) を足したもの。
// ビルドが provider を実行して state.data.<名前> に入れ、仕様の部品は { "$state": "/data/<名前>" } で行を指す。
// AI は行・数値を書かない (データの部品の rows は $state でしか書けない)
// provider の引数・部品の props・when の値は文書を書く人が決め、形は provider と部品ごとに違うので、スキーマでは
// z.unknown() で受ける (provider の引数は実行するときに registry のスキーマで確かめる。雛形は ReportProviderSource で型を確かめる)

/** データの宣言 1 つ */
export const ReportDataSource = z.object({
    provider: z.string().min(1).describe('Report provider name (list_report_providers).'),
    args: z.record(z.string(), z.unknown()).optional().describe('Arguments of the provider.'),
    withSource: z
        .boolean()
        .optional()
        .describe(
            'true adds a source excerpt (_source) to each row that has a position (for DataTable showSource).',
        ),
    diff: z
        .boolean()
        .optional()
        .describe(
            'Comparison of this data only: true compares the saved baseline with the working tree, false is the current state only. Omit to use the document comparison.',
        ),
    compare: CompareRange.optional().describe(
        'Comparison of this data only: two points of git (e.g. { "from": "main" }). Takes precedence over diff.',
    ),
    where: z
        .record(z.string(), z.unknown())
        .optional()
        .describe(
            'Keep the rows whose field (a.b for nested) equals the value; an array value means one of the values. For rows data only. E.g. { "member": "${m.owner}.${m.name}" } in a for.',
        ),
});
export type ReportDataSource = z.infer<typeof ReportDataSource>;

/**
 * 要素を出す条件 (if)。ビルドのときに決める (docs/todo.md 3.2.1 の 2)。
 * value は `${m.name}` などの値 (for の行)、hasRows はデータが 1 行以上あるか (true はこの要素のデータ、文字列は data の名前、
 * オブジェクトはデータの宣言そのもの (見出しのカードに、中の表と同じ宣言を書いて、行がなければカードごと消す))
 */
export type ReportCondition =
    | { all: ReportCondition[] }
    | { any: ReportCondition[] }
    | { not: ReportCondition }
    | { hasRows: true | string | ReportDataSource }
    | {
          value?: unknown;
          eq?: unknown;
          neq?: unknown;
          gt?: number | undefined;
          gte?: number | undefined;
          lt?: number | undefined;
          lte?: number | undefined;
          in?: unknown[] | undefined;
          exists?: boolean | undefined;
      };

export const ReportCondition: z.ZodType<ReportCondition> = z.lazy(() =>
    z.union([
        z.object({ all: z.array(ReportCondition).min(1) }).strict(),
        z.object({ any: z.array(ReportCondition).min(1) }).strict(),
        z.object({ not: ReportCondition }).strict(),
        z
            .object({
                hasRows: z
                    .union([z.literal(true), z.string().min(1), ReportDataSource])
                    .describe(
                        'true: the data of this element has rows / "<name>": the data <name> has rows / a data declaration ({ provider, args, where }): it has rows (e.g. on a Card around a table with the same data, to hide the card when empty).',
                    ),
            })
            .strict(),
        z
            .object({
                value: z.unknown().describe('Value to test, e.g. "${m.static}".'),
                eq: z.unknown().optional(),
                neq: z.unknown().optional(),
                gt: z.number().optional(),
                gte: z.number().optional(),
                lt: z.number().optional(),
                lte: z.number().optional(),
                in: z.array(z.unknown()).optional().describe('The value is one of these.'),
                exists: z
                    .boolean()
                    .optional()
                    .describe('true: the value is not empty (null, "", [] and false are empty).'),
            })
            .strict()
            .refine((condition) => 'value' in condition, 'value is required'),
    ]),
);

/** 要素を、データの行ごとに繰り返す (for)。ビルドのときに展開する (docs/todo.md 3.2.1 の 2) */
export const ReportFor = z
    .object({
        as: z
            .string()
            .regex(/^[A-Za-z_][A-Za-z0-9_]*$/)
            .describe(
                'Variable name of the row (e.g. "m"). Use it as "${m.name}" in props, data args and if.',
            ),
        in: z
            .union([z.string().min(1).describe('Name of a data declaration.'), ReportDataSource])
            .describe(
                'Rows to repeat over: a data declaration (provider, args) or the name of one.',
            ),
        limit: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Maximum number of repeats (default 200; more rows are cut with a warning).'),
    })
    .strict();
export type ReportFor = z.infer<typeof ReportFor>;

/** レポートの文書 */
export const ReportDocument = z.object({
    $schema: z
        .string()
        .optional()
        .describe(
            'Path or URL of the JSON Schema of documents (for editors). The build ignores it.',
        ),
    title: z.string().min(1),
    diff: z
        .boolean()
        .optional()
        .describe(
            'true compares the saved baseline with the working tree (rows get status). Omit for a report of the current state (everything, no status).',
        ),
    compare: CompareRange.optional().describe(
        'Two points of git to compare (e.g. { "from": "main" } for main...working tree). Takes precedence over diff.',
    ),
    data: z
        .record(z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/), ReportDataSource)
        .describe('Data used by the spec. Each key is bound as { "$state": "/data/<key>" }.'),
    params: z
        .record(
            z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
            z
                .object({
                    default: z.unknown().optional().describe('Value when the build gives none.'),
                    description: z.string().optional(),
                })
                .strict(),
        )
        .optional()
        .describe(
            'Parameters of the document (values of the structure only: data types, depth, switches; never names of individual classes or objects), used as "${params.<name>}" in title, props, data args and if. Values given to the build (build_report params) win over default. E.g. { "depth": { "default": 2 } } and "depth": "${params.depth}".',
        ),
    notes: z
        .record(z.string(), z.string())
        .optional()
        .describe(
            'Texts (markdown) by key, used as { "$note": "<key>" } in props (e.g. { "$note": "${m.name}" } in a for).',
        ),
    spec: z
        .object({
            root: z.string(),
            elements: z.record(
                z.string(),
                z.object({
                    type: z.string(),
                    props: z.record(z.string(), z.unknown()),
                    children: z.array(z.string()).optional(),
                    visible: z.unknown().optional(),
                    data: ReportDataSource.optional().describe(
                        'Data of this component (data components only). The build declares it in data and binds the data prop.',
                    ),
                    for: ReportFor.optional().describe(
                        'Repeat this element (and its children) for each row. Expanded by the build.',
                    ),
                    if: ReportCondition.optional().describe(
                        'Show this element only when the condition holds. Decided by the build.',
                    ),
                    page: z
                        .object({
                            title: z
                                .string()
                                .optional()
                                .describe(
                                    'Title of the page (default: the title prop of the element).',
                                ),
                            file: z
                                .string()
                                .optional()
                                .describe(
                                    'File name of the page without .html (default: the element key). ${m.x} can be used.',
                                ),
                        })
                        .strict()
                        .optional()
                        .describe(
                            'Put this element (each repeat of a for) and its children on a page of its own (pages/<file>.html). The document shows a link (PageLink) in its place, as a table of contents. Use it to split large documents (a page per class, object ...).',
                        ),
                }),
            ),
        })
        .describe('json-render spec (root and flat elements).'),
});
export type ReportDocument = z.infer<typeof ReportDocument>;

/** 問題 1 つ (要素のキーとプロパティの場所) */
export type ReportIssue = { path: string; message: string };

// ---------------------------------------------------------------------------
// データの比べ方と、部品に書いたデータ (docs/todo.md 3.2.1 の 1)
// ---------------------------------------------------------------------------

/** データの比べ方 (current: 今の状態だけ / diff: 保存した基準 → 作業ツリー / range: git の範囲) */
export type DataComparison =
    { kind: 'current' } | { kind: 'diff' } | { kind: 'range'; range: CompareRange };

/** データの宣言が自分の比べ方を持てば返す。持たなければ文書の比べ方 (ビルドに渡した入力) を使う */
export const comparisonOfSource = (source: ReportDataSource): DataComparison | undefined => {
    if (source.compare) return { kind: 'range', range: source.compare };
    if (source.diff === undefined) return undefined;
    return source.diff ? { kind: 'diff' } : { kind: 'current' };
};

/** 比べ方の同じものを 1 つにまとめるためのキー */
export const comparisonKey = (comparison: DataComparison): string =>
    comparison.kind === 'range'
        ? `range:${comparison.range.from}...${comparison.range.to ?? ''}`
        : comparison.kind;

/** 部品のキーから、データの名前を作る (data の名前の決まり ^[A-Za-z][A-Za-z0-9_]*$ に合わせ、重ならないようにする) */
const dataNameOf = (key: string, used: Set<string>): string => {
    const cleaned = key.replace(/[^A-Za-z0-9_]/g, '_');
    const base = /^[A-Za-z]/.test(cleaned) ? cleaned : `d_${cleaned}`;
    let name = base;
    for (let i = 2; used.has(name); i++) name = `${base}_${i}`;
    used.add(name);
    return name;
};

export type NormalizedReportDocument = {
    /** 部品に書いたデータを data に移した文書 (今の形) */
    document: ReportDocument;
    issues: ReportIssue[];
    /** data の名前 → そのデータを書いた部品のキー (問題の場所を、書いた場所で返すため) */
    origins: Record<string, string>;
};

/**
 * 部品に書いたデータ (`"data": { provider, args, diff, compare }`) を、上の段の data に移し、
 * 部品のデータの props を `{ "$state": "/data/<名前>" }` にする。データの名前は部品のキーから作る
 */
export const normalizeReportDocument = (document: ReportDocument): NormalizedReportDocument => {
    const data = { ...document.data };
    const used = new Set(Object.keys(data));
    const elements: ReportDocument['spec']['elements'] = {};
    const issues: ReportIssue[] = [];
    const origins: Record<string, string> = {};
    for (const [key, element] of Object.entries(document.spec.elements)) {
        const { data: source, ...rest } = element;
        if (!source) {
            elements[key] = element;
            continue;
        }
        elements[key] = rest;
        const binding = REPORT_DATA_BINDINGS[element.type as ReportComponentName];
        if (!binding) {
            issues.push({
                path: `spec.${key}.data`,
                message: `${element.type} does not take data. Data components: ${Object.keys(REPORT_DATA_BINDINGS).join(', ')}`,
            });
            continue;
        }
        const written = element.props[binding.prop];
        if (written !== undefined && written !== null) {
            issues.push({
                path: `spec.${key}.props.${binding.prop}`,
                message: `Write the data either in data or in props.${binding.prop}, not both.`,
            });
            continue;
        }
        const name = dataNameOf(key, used);
        data[name] = source;
        origins[name] = key;
        elements[key] = {
            ...rest,
            props: { ...rest.props, [binding.prop]: { $state: `/data/${name}` } },
        };
    }
    return {
        document: { ...document, data, spec: { ...document.spec, elements } },
        issues,
        origins,
    };
};

/** 文書のデータが自分で持つ比べ方 (同じものは 1 つ)。ビルドの前に、その分の入力を読むため。形が誤っていれば空 */
export const comparisonsOf = (document: unknown): DataComparison[] => {
    const parsed = ReportDocument.safeParse(expandShorthand(document));
    if (!parsed.success) return [];
    const found = new Map<string, DataComparison>();
    const add = (source: ReportDataSource) => {
        const comparison = comparisonOfSource(source);
        if (comparison) found.set(comparisonKey(comparison), comparison);
    };
    for (const source of Object.values(parsed.data.data)) add(source);
    for (const element of Object.values(parsed.data.spec.elements)) {
        if (element.data) add(element.data);
        if (element.for && typeof element.for.in !== 'string') add(element.for.in);
    }
    return [...found.values()];
};

const isStateRef = (value: unknown): value is { $state: string } =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { $state?: unknown }).$state === 'string';

/**
 * 文書を検証する。json-render の構造の検証 (validateSpec) に加えて、
 * - 未知のコンポーネント
 * - 行のプロパティが $state で、宣言したデータを指しているか (AI が行を書いていないか)
 * - props がカタログの zod に合うか ($state は state で解決してから)
 * state は provider を実行した結果 ({ data: { <名前>: 行 } })。まだなければ props の型は確かめない
 */
export const validateReportDocument = (
    document: ReportDocument,
    state?: Record<string, unknown>,
): ReportIssue[] => {
    const issues: ReportIssue[] = [];
    const structure = validateSpec(document.spec as Spec, { checkOrphans: true });
    for (const issue of structure.issues) {
        if (issue.severity === 'error') {
            issues.push({
                path: `spec${issue.elementKey ? `.${issue.elementKey}` : ''}`,
                message: issue.message,
            });
        }
    }
    for (const [key, element] of Object.entries(document.spec.elements)) {
        const definition = (REPORT_COMPONENTS as Record<string, { props: z.ZodType }>)[
            element.type
        ];
        if (!definition) {
            issues.push({
                path: `spec.${key}.type`,
                message: `Unknown component: ${element.type}`,
            });
            continue;
        }
        const binding = REPORT_DATA_BINDINGS[element.type as ReportComponentName];
        if (binding) {
            const name = binding.prop;
            const value = element.props[name];
            const match = isStateRef(value) ? value.$state.match(/^\/data\/([^/]+)$/) : null;
            if (!match) {
                issues.push({
                    path: `spec.${key}.props.${name}`,
                    message:
                        'Data must be bound with { "$state": "/data/<name>" } (do not write rows or data).',
                });
            } else if (!(match[1]! in document.data)) {
                issues.push({
                    path: `spec.${key}.props.${name}`,
                    message: `Unknown data: ${match[1]} (declare it in data)`,
                });
            }
        }
        if (!state) continue;
        const resolved = resolveElementProps(element.props, { stateModel: state });
        const parsed = definition.props.safeParse(resolved);
        if (!parsed.success) {
            for (const issue of parsed.error.issues) {
                issues.push({
                    path: `spec.${key}.props${issue.path.length ? `.${issue.path.join('.')}` : ''}`,
                    message: issue.message,
                });
            }
        }
    }
    return issues;
};
