import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { loadSampleInput } from '../../docs/examples/report/scripts/run-report';
import type { ReportInput } from '../../src/analyzer/report';
import { resolveReport } from '../../src/builder/reportBuilder';
import { sourceIndexOf } from '../../src/builder/sources';
import { ReportView } from '../../src/viewer/report/view';

// R4 の部品 (行列・図・オブジェクトの形のデータ・ソースの抜き出し)。サンプルのリポジトリ (before → after) のデータで描く

const el = (type: string, props: Record<string, unknown>, children: string[] = []) => ({
    type,
    props,
    children,
});

const documentOf = (data: Record<string, unknown>, elements: Record<string, unknown>) => ({
    title: '部品のテスト',
    data,
    spec: {
        root: 'page',
        elements: {
            page: el(
                'Stack',
                { direction: 'vertical', gap: 'md', align: null, justify: null, className: null },
                Object.keys(elements),
            ),
            ...elements,
        },
    },
});

describe('レポートの部品 (R4)', () => {
    let input: ReportInput;
    before(async () => {
        input = await loadSampleInput();
    });

    const render = (document: unknown) => {
        const resolved = resolveReport(document, input);
        assert.ok(resolved.ok, JSON.stringify(!resolved.ok && resolved.issues));
        return renderToString(createElement(ReportView, { report: resolved.report }));
    };

    it('行列・図・オブジェクトの形のデータの部品が、サンプルのデータで描ける', () => {
        const html = render(
            documentOf(
                {
                    objectAccess: {
                        provider: 'permission.objectAccess',
                        args: { onlyChanged: true },
                    },
                    flows: { provider: 'flow.diagram' },
                    graph: { provider: 'dependency.graph' },
                    layouts: { provider: 'layout.detail' },
                    pages: { provider: 'flexiPage.detail' },
                    automation: { provider: 'automation.byObject' },
                    impact: { provider: 'dependency.impact' },
                },
                {
                    matrix: el('Matrix', {
                        data: { $state: '/data/objectAccess' },
                        onlyChanged: true,
                    }),
                    flow: el('FlowDiagram', { data: { $state: '/data/flows' }, flow: null }),
                    text: el('DiagramText', { data: { $state: '/data/graph' }, title: null }),
                    layout: el('LayoutView', { data: { $state: '/data/layouts' } }),
                    flexiPage: el('FlexiPageView', { data: { $state: '/data/pages' } }),
                    automationView: el('AutomationView', { data: { $state: '/data/automation' } }),
                    impactView: el('ImpactView', { data: { $state: '/data/impact' } }),
                },
            ),
        );
        // 行列: 権限の文字と凡例
        assert.match(html, /C: 作成/);
        assert.match(html, /Invoice__c/);
        // Flow の図: Flow の名前
        assert.match(html, /Invoice_Status_Update/);
        // 依存関係の図の文字列 (Mermaid)
        assert.match(html, /flowchart|graph/);
        // レイアウト・自動化・影響
        assert.match(html, /関連リスト|アクション/);
        assert.match(html, /入力規則|Apex トリガー|レコードトリガーフロー/);
        assert.match(html, /影響を受ける単位/);
    });

    it('受け取れないデータ (形・provider の違う) を渡すと問題にする', () => {
        const resolved = resolveReport(
            documentOf(
                { flows: { provider: 'flow.list' } },
                { matrix: el('Matrix', { data: { $state: '/data/flows' }, onlyChanged: null }) },
            ),
            input,
        );
        assert.ok(!resolved.ok);
        assert.ok(
            resolved.issues.some((i) =>
                i.message.includes('Matrix does not accept flow.list (rows)'),
            ),
            JSON.stringify(resolved.issues),
        );
    });

    it('withSource のデータの行にソースの抜き出しが付き、DataTable の showSource で見せる', () => {
        const document = documentOf(
            { apex: { provider: 'apex.interface', args: { onlyChanged: true }, withSource: true } },
            {
                table: el('DataTable', {
                    rows: { $state: '/data/apex' },
                    columns: [{ key: 'name', label: '名前' }],
                    caption: null,
                    onlyChanged: null,
                    showSource: true,
                }),
            },
        );
        const resolved = resolveReport(document, input);
        assert.ok(resolved.ok);
        const rows = (
            resolved.report.spec.state.data as {
                apex: { name: string; _source?: { filePath: string; text: string } }[];
            }
        ).apex;
        const calc = rows.find((row) => row.name === 'calc')!;
        assert.ok(calc._source, 'ソースの抜き出し');
        assert.match(calc._source.filePath, /AccountService\.cls$/);
        assert.match(calc._source.text, /calc/);
        // 削除された行は、削除前 (before) のソースから引く (別のファイルの同じ位置のソースを付けない)
        const oldHelper = rows.find((row) => row.name === 'OldHelper')!;
        assert.match(oldHelper._source!.filePath, /OldHelper\.cls$/);
        assert.match(oldHelper._source!.text, /OldHelper/);
        const html = renderToString(createElement(ReportView, { report: resolved.report }));
        assert.match(html, /<details/);
        assert.match(html, /AccountService\.cls(<!-- -->)?:(<!-- -->)?\d+/);
    });

    it('機密になりうる値を持つ種類 (指定ログイン情報など) のソースは抜き出さない', () => {
        const index = sourceIndexOf(input.after);
        assert.ok(index.size > 0);
        assert.ok(
            [...index.values()].every(
                (excerpt) =>
                    !/namedCredentials|emailTemplates|customMetadata/.test(excerpt.filePath),
            ),
        );
    });
    it('LWC のワイヤーフレームと ER 図が、サンプルのデータで描ける (JS は実行しない)', () => {
        const html = render(
            documentOf(
                {
                    wireframe: { provider: 'lwc.wireframe', args: { components: ['accountList'] } },
                    diagram: { provider: 'object.diagram' },
                },
                {
                    wireframeView: el('LwcWireframe', {
                        data: { $state: '/data/wireframe' },
                        component: null,
                    }),
                    diagramView: el('ObjectDiagram', {
                        data: { $state: '/data/diagram' },
                        showAllFields: null,
                    }),
                },
            ),
        );
        // lightning-card のタイトルの式・ボタンのラベル・子コンポーネント・分岐のタブ・繰り返しの印
        assert.match(html, /‹<!-- -->title<!-- -->›|‹title›/);
        assert.match(html, /c\/accountRow/);
        assert.match(html, /× n/);
        assert.match(html, />if /);
    });
});
