import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { loadSampleInput } from '../../docs/examples/report/scripts/run-report';
import type { ReportInput } from '../../src/analyzer/report';
import { type ResolvedReport, resolveReport } from '../../src/builder/reportBuilder';
import { comparisonsOf } from '../../src/report/document';
import { ReportView } from '../../src/viewer/report/view';

// 文書の省略と短い書き方 (src/report/shorthand.ts。docs/todo.md 3.2)

const ok = (resolved: ResolvedReport) => {
    assert.ok(resolved.ok, JSON.stringify(!resolved.ok && resolved.issues));
    return resolved;
};

const html = (resolved: ResolvedReport & { ok: true }) =>
    renderToString(createElement(ReportView, { report: resolved.report }));

describe('文書の省略と短い書き方', () => {
    let input: ReportInput;
    before(async () => {
        input = { after: (await loadSampleInput()).after };
    });

    it('入れ子・省いた props と children・"@名前" は、すべて書いた文書と同じ HTML になる', () => {
        const short = ok(
            resolveReport(
                {
                    title: '短い書き方',
                    data: { flows: { provider: 'flow.list' } },
                    spec: {
                        root: {
                            type: 'Stack',
                            props: { direction: 'vertical', gap: 'lg' },
                            children: [
                                { type: 'Narrative', props: { markdown: '概要' } },
                                {
                                    key: 'interface',
                                    type: 'DataTable',
                                    data: { provider: 'flow.interface' },
                                },
                                { type: 'DataTable', props: { rows: '@flows' } },
                            ],
                        },
                    },
                },
                input,
            ),
        );
        const full = ok(
            resolveReport(
                {
                    title: '短い書き方',
                    data: { flows: { provider: 'flow.list' } },
                    spec: {
                        root: 'root',
                        elements: {
                            root: {
                                type: 'Stack',
                                props: {
                                    direction: 'vertical',
                                    gap: 'lg',
                                    align: null,
                                    justify: null,
                                    className: null,
                                },
                                children: ['root_0', 'interface', 'root_2'],
                            },
                            root_0: {
                                type: 'Narrative',
                                props: { title: null, markdown: '概要' },
                                children: [],
                            },
                            interface: {
                                type: 'DataTable',
                                props: {
                                    columns: null,
                                    caption: null,
                                    onlyChanged: null,
                                    showSource: null,
                                },
                                children: [],
                                data: { provider: 'flow.interface' },
                            },
                            root_2: {
                                type: 'DataTable',
                                props: {
                                    rows: { $state: '/data/flows' },
                                    columns: null,
                                    caption: null,
                                    onlyChanged: null,
                                    showSource: null,
                                },
                                children: [],
                            },
                        },
                    },
                },
                input,
            ),
        );
        assert.deepEqual(short.report, full.report);
        assert.equal(html(short), html(full));
    });

    it('データをすべて要素に書けば data を省ける。省けない props (値の要るもの) は問題にする', () => {
        ok(
            resolveReport(
                {
                    title: 't',
                    spec: { root: { type: 'DataTable', data: { provider: 'flow.list' } } },
                },
                input,
            ),
        );
        const missing = resolveReport(
            { title: 't', spec: { root: { type: 'Narrative', props: { title: '見出し' } } } },
            input,
        );
        assert.ok(!missing.ok);
        assert.ok(missing.issues.some((issue) => issue.path === 'spec.root.props.markdown'));
    });

    it('入れ子の要素のデータの比べ方も、先に読む対象になる', () => {
        assert.deepEqual(
            comparisonsOf({
                title: 't',
                spec: {
                    root: {
                        type: 'Stack',
                        children: [
                            { type: 'DataTable', data: { provider: 'flow.list', diff: true } },
                        ],
                    },
                },
            }),
            [{ kind: 'diff' }],
        );
    });
});
