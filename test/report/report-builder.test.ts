import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { loadSampleInput } from '../../docs/examples/report/scripts/run-report';
import type { ReportInput } from '../../src/analyzer/report';
import { resolveReport, writeReportHtml } from '../../src/builder/reportBuilder';
import { ReportView } from '../../src/viewer/report/view';

// レポートの文書 → HTML (docs/implementation-roadmap.md の R1。json-render の仕様 ＋ データの宣言)

const SPEC = path.resolve('docs/examples/report/specs/code-interface.json');

const el = (type: string, props: Record<string, unknown>, children: string[] = []) => ({
    type,
    props,
    children,
});

/** 表 1 つだけの文書 */
const tableDocument = (props: Record<string, unknown>, data?: Record<string, unknown>) => ({
    title: 'テスト',
    data: data ?? { flow: { provider: 'flow.interface', args: { onlyChanged: true } } },
    spec: {
        root: 'table',
        elements: {
            table: el('DataTable', {
                rows: { $state: '/data/flow' },
                columns: null,
                caption: null,
                onlyChanged: null,
                ...props,
            }),
        },
    },
});

describe('レポートの文書と HTML', () => {
    let input: ReportInput;
    let tmp: string;
    before(async () => {
        input = await loadSampleInput();
        tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'report-builder-'));
    });
    after(() => fs.rm(tmp, { recursive: true, force: true }));

    it('データの宣言の provider を実行して state.data に入れ、props まで検証する', async () => {
        const document = JSON.parse(await fs.readFile(SPEC, 'utf8'));
        const resolved = resolveReport(document, input);
        assert.ok(resolved.ok, JSON.stringify(!resolved.ok && resolved.issues));
        const data = resolved.report.spec.state.data as Record<string, { status?: string }[]>;
        assert.deepEqual(Object.keys(data), ['apex', 'lwc', 'flow']);
        assert.ok(data.apex!.length > 0);
        // onlyChanged の引数が provider に渡る (変化したものだけ)
        assert.ok(data.apex!.every((row) => row.status !== 'unchanged'));
    });

    it('埋め込むデータは位置のキーを落とし、ファイルのパスをリポジトリからの相対パスにする', async () => {
        const document = JSON.parse(await fs.readFile(SPEC, 'utf8'));
        const resolved = resolveReport(document, input);
        assert.ok(resolved.ok);
        const json = JSON.stringify(resolved.report.spec.state);
        assert.ok(!json.includes('"sourceKeys"'));
        // 手元のフォルダ名を HTML に入れない
        assert.ok(!json.includes(JSON.stringify(input.after.root).slice(1, -1)));
        const rows = resolved.report.spec.state.data as Record<string, { filePath?: string }[]>;
        assert.ok(rows.apex!.some((row) => row.filePath?.startsWith('force-app/')));
        assert.equal(resolved.warnings, undefined);
        // 大きさの目安を超えたら、誤りにせず警告する (どのデータが大きいかも出す)
        const large = resolveReport(document, input, { warningBytes: 10 });
        assert.ok(large.ok);
        assert.match(large.warnings![0]!.message, /embedded data is large.*Largest: /);
    });

    it('AI が行を書いた・宣言していないデータ・知らない部品・props の誤りを問題にする', () => {
        const issues = (document: unknown) => {
            const resolved = resolveReport(document, input);
            return resolved.ok ? [] : resolved.issues.map((i) => `${i.path}: ${i.message}`);
        };
        // 行を直接書いた
        assert.ok(
            issues(tableDocument({ rows: [{ status: 'added' }] })).some((i) =>
                i.includes('Data must be bound'),
            ),
        );
        // 宣言していないデータを指した
        assert.ok(
            issues(tableDocument({ rows: { $state: '/data/missing' } })).some((i) =>
                i.includes('Unknown data: missing'),
            ),
        );
        // 知らない provider
        assert.ok(
            issues(tableDocument({}, { flow: { provider: 'no.such' } })).some((i) =>
                i.includes('Unknown provider'),
            ),
        );
        // 知らない部品と、props の型の誤り (onlyChanged は真偽値か null)
        const document = tableDocument({ onlyChanged: 'yes' });
        (document.spec.elements as Record<string, unknown>).table = el('DataTable', {
            rows: { $state: '/data/flow' },
            columns: null,
            caption: null,
            onlyChanged: 'yes',
        });
        assert.ok(issues(document).some((i) => i.startsWith('spec.table.props.onlyChanged')));
        const unknown = tableDocument({});
        unknown.spec.root = 'x';
        (unknown.spec.elements as Record<string, unknown>).x = el('Chart', {});
        assert.ok(issues(unknown).some((i) => i.includes('Unknown component: Chart')));
    });

    it('provider の引数の誤りと、行の部品に rows 以外の形のデータを渡したことを問題にする', () => {
        const issues = (document: unknown) => {
            const resolved = resolveReport(document, input);
            return resolved.ok ? [] : resolved.issues.map((i) => `${i.path}: ${i.message}`);
        };
        assert.ok(
            issues(
                tableDocument(
                    {},
                    { flow: { provider: 'flow.interface', args: { onlyChanged: 'yes' } } },
                ),
            ).some((i) => i.startsWith('data.flow.args.onlyChanged')),
        );
        // dependency.dependents は target が必須
        assert.ok(
            issues(tableDocument({}, { flow: { provider: 'dependency.dependents' } })).some((i) =>
                i.startsWith('data.flow.args.target'),
            ),
        );
        // dependency.graph の出力は図 (rows ではない)
        assert.ok(
            issues(tableDocument({}, { flow: { provider: 'dependency.graph' } })).some((i) =>
                i.includes('does not accept dependency.graph (diagram)'),
            ),
        );
    });

    it('Narrative は Markdown を描き、生の HTML は描かない', () => {
        const document = {
            title: 'テスト',
            data: {},
            spec: {
                root: 'n',
                elements: {
                    n: el('Narrative', {
                        markdown: [
                            '## 要約',
                            '',
                            '- **重要**: 公開メソッドが減った',
                            '',
                            '<script>alert(1)</script>',
                        ].join(String.fromCharCode(10)),
                        title: null,
                    }),
                },
            },
        };
        const resolved = resolveReport(document, input);
        assert.ok(resolved.ok, JSON.stringify(!resolved.ok && resolved.issues));
        const html = renderToString(createElement(ReportView, { report: resolved.report }));
        assert.ok(html.includes('<h2>要約</h2>'), html);
        assert.ok(html.includes('<strong>重要</strong>'));
        assert.ok(!html.includes('<script>alert(1)</script>'));
    });

    it('HTML の置き場に文書を入れ、</script> を含む値でも壊れない', async () => {
        const template = path.join(tmp, 'template.html');
        await fs.writeFile(
            template,
            '<html><head><script type="application/json" id="metascope-report">null</script></head><body></body></html>',
        );
        const resolved = resolveReport(tableDocument({}), input);
        assert.ok(resolved.ok);
        const report = { ...resolved.report, title: 'a</script><b>' };
        const output = await writeReportHtml(report, path.join(tmp, 'out', 'r.html'), template);
        const html = await fs.readFile(output, 'utf8');
        const json = html.match(
            /<script type="application\/json" id="metascope-report">([\s\S]*?)<\/script>/,
        )![1]!;
        assert.ok(!json.includes('<'));
        assert.deepEqual(JSON.parse(json), report);
    });

    it('viewer の部品で描ける (表の行と status のバッジ)', async () => {
        const document = JSON.parse(await fs.readFile(SPEC, 'utf8'));
        const resolved = resolveReport(document, input);
        assert.ok(resolved.ok);
        const html = renderToString(createElement(ReportView, { report: resolved.report }));
        assert.ok(html.includes('公開の形と Flow の入出力の変化'));
        assert.ok(html.includes('Apex の公開メソッド・プロパティ'));
        // 行の値 (sample の after で増えた Apex のメソッド) と、status のバッジ
        assert.ok(html.includes('calc'), 'apex の行');
        assert.ok(html.includes('追加'));
        assert.ok(html.includes('errorMessage'), 'flow の行');
    });
});
