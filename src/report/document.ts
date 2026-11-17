import { type Spec, resolveElementProps, validateSpec } from '@json-render/core';
import { z } from 'zod';

import { CompareRange } from '../analyzer/unit/gitRange';

import { REPORT_COMPONENTS, REPORT_DATA_BINDINGS, type ReportComponentName } from './catalog';

// レポートの文書 (docs/implementation-roadmap.md 4.1)。
// json-render の仕様 (spec) に、データの宣言 (data: 名前 → provider と引数) を足したもの。
// ビルドが provider を実行して state.data.<名前> に入れ、仕様の部品は { "$state": "/data/<名前>" } で行を指す。
// AI は行・数値を書かない (データの部品の rows は $state でしか書けない)

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
});

/** レポートの文書 */
export const ReportDocument = z.object({
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
                }),
            ),
        })
        .describe('json-render spec (root and flat elements).'),
});
export type ReportDocument = z.infer<typeof ReportDocument>;

/** 問題 1 つ (要素のキーとプロパティの場所) */
export type ReportIssue = { path: string; message: string };

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
