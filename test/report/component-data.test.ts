import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { loadSampleInput } from '../../docs/examples/report/scripts/run-report';
import type { ReportInput } from '../../src/analyzer/report';
import { type ResolveReportOptions, resolveReport } from '../../src/builder/reportBuilder';
import { comparisonsOf } from '../../src/report/document';
import { ReportView } from '../../src/viewer/report/view';

// 部品に書いたデータと、データごとの比べ方 (docs/todo.md 3.2.1 の 1)

const table = (data?: Record<string, unknown>, props: Record<string, unknown> = {}) => ({
    type: 'DataTable',
    props: { columns: null, caption: null, onlyChanged: null, ...props },
    children: [],
    ...(data ? { data } : {}),
});

const stack = (children: string[]) => ({
    type: 'Stack',
    props: { direction: 'vertical', gap: 'md', align: null, justify: null, className: null },
    children,
});

describe('部品に書いたデータと、データごとの比べ方', () => {
    let sample: Required<ReportInput>;
    /** 文書の比べ方は今の状態だけ。データが diff: true を持てば、サンプルの before → after を使う */
    let inputFor: NonNullable<ResolveReportOptions['inputFor']>;
    before(async () => {
        sample = (await loadSampleInput()) as Required<ReportInput>;
        inputFor = (comparison) =>
            comparison.kind === 'diff'
                ? { input: sample, compared: '保存した基準 → 作業ツリー' }
                : comparison.kind === 'current'
                  ? { input: { after: sample.after }, compared: '作業ツリー' }
                  : undefined;
    });
    const current = () => ({ after: sample.after });

    it('部品の data を上の段の data に移し、データの props を $state にする (名前は部品のキーから)', () => {
        const resolved = resolveReport(
            {
                title: 't',
                data: { flow_table: { provider: 'flow.list' } },
                spec: {
                    root: 'page',
                    elements: {
                        page: stack(['flow-table']),
                        'flow-table': table({ provider: 'flow.interface' }),
                    },
                },
            },
            current(),
        );
        assert.ok(resolved.ok, JSON.stringify(!resolved.ok && resolved.issues));
        const data = resolved.report.spec.state.data as Record<string, unknown[]>;
        // flow-table → flow_table は上の段のデータと重なるので flow_table_2
        assert.deepEqual(Object.keys(data), ['flow_table', 'flow_table_2']);
        assert.deepEqual(resolved.report.spec.elements['flow-table']!.props.rows, {
            $state: '/data/flow_table_2',
        });
        assert.equal(resolved.report.spec.state.compared, undefined);
    });

    it('データごとの比べ方: diff: true のデータだけ status が付き、比べた時点を state に入れる', () => {
        const document = {
            title: 't',
            data: {},
            spec: {
                root: 'page',
                elements: {
                    page: stack(['now', 'changes', 'permissions']),
                    now: table({ provider: 'flow.interface' }),
                    changes: table({ provider: 'flow.interface', diff: true }),
                    // 差分だけを返す provider も、データが比べ方を持てば使える
                    permissions: table({ provider: 'permission.diffs', diff: true }),
                },
            },
        };
        assert.deepEqual(comparisonsOf(document), [{ kind: 'diff' }]);
        const resolved = resolveReport(document, current(), { inputFor });
        assert.ok(resolved.ok, JSON.stringify(!resolved.ok && resolved.issues));
        const data = resolved.report.spec.state.data as Record<string, { status?: string }[]>;
        assert.ok(data.now!.every((row) => row.status === undefined));
        assert.ok(data.changes!.some((row) => row.status === 'added'));
        assert.deepEqual(resolved.report.spec.state.compared, {
            changes: '保存した基準 → 作業ツリー',
            permissions: '保存した基準 → 作業ツリー',
        });
        // viewer は、比べ方を持つ部品の上に比べた時点を出す
        const html = renderToString(createElement(ReportView, { report: resolved.report }));
        assert.equal(html.split('比べた時点: 保存した基準 → 作業ツリー').length - 1, 2);
    });

    it('diff: false は、文書が比べていても今の状態だけ', () => {
        const resolved = resolveReport(
            {
                title: 't',
                diff: true,
                data: {},
                spec: {
                    root: 'now',
                    elements: { now: table({ provider: 'flow.interface', diff: false }) },
                },
            },
            sample,
            { inputFor },
        );
        assert.ok(resolved.ok);
        const data = resolved.report.spec.state.data as Record<string, { status?: string }[]>;
        assert.ok(data.now!.every((row) => row.status === undefined));
    });

    it('問題は、データを書いた部品の場所で返す', () => {
        const resolved = resolveReport(
            {
                title: 't',
                data: {},
                spec: {
                    root: 'page',
                    elements: {
                        page: stack(['bad', 'noInput', 'both', 'heading']),
                        bad: table({ provider: 'object.fields', args: { objects: 'Invoice__c' } }),
                        noInput: table({ provider: 'flow.interface', compare: { from: 'main' } }),
                        both: table({ provider: 'flow.list' }, { rows: { $state: '/data/x' } }),
                        heading: {
                            type: 'Heading',
                            props: { text: 'h', level: null },
                            children: [],
                            data: { provider: 'flow.list' },
                        },
                    },
                },
            },
            current(),
            { inputFor },
        );
        assert.ok(!resolved.ok);
        const paths = resolved.issues.map((issue) => issue.path);
        assert.ok(paths.includes('spec.bad.data.args.objects'), paths.join(', '));
        assert.ok(paths.includes('spec.noInput.data'), paths.join(', '));
        assert.ok(paths.includes('spec.both.props.rows'), paths.join(', '));
        assert.ok(paths.includes('spec.heading.data'), paths.join(', '));
        assert.match(
            resolved.issues.find((issue) => issue.path === 'spec.noInput.data')!.message,
            /range:main\.\.\./,
        );
    });
});
