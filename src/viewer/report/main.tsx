import '@xyflow/react/dist/style.css';
import { App } from '@modelcontextprotocol/ext-apps';
import { StrictMode } from 'react';
import { type Root, createRoot } from 'react-dom/client';

import { REPORT_META_KEY, REPORT_SCRIPT_ID } from '../../report/embedding';

import { type EmbeddedReport, ReportView } from './view';
import './styles.css';

// レポートの viewer (事前に 1 回だけビルドする。docs/implementation-roadmap.md 4.4)。
// 1. ビルドが HTML の <script id="metascope-report"> に入れた文書を読んで描く (ファイルとして開いたとき)
// 2. 文書がなく、iframe の中 (MCP Apps の画面) なら、App で接続し、build_report の結果の _meta からレポートを受け取る

const readEmbedded = (): EmbeddedReport | null => {
    const text = document.getElementById(REPORT_SCRIPT_ID)?.textContent ?? 'null';
    try {
        return JSON.parse(text) as EmbeddedReport | null;
    } catch {
        return null;
    }
};

const render = (root: Root, report: EmbeddedReport | null, message: string) => {
    if (report) document.title = report.title;
    root.render(
        <StrictMode>
            {report ? <ReportView report={report} /> : <p className="p-6">{message}</p>}
        </StrictMode>,
    );
};

/** ツールの結果からレポートを取り出す (_meta、なければ structuredContent.report) */
const reportOfResult = (result: {
    _meta?: Record<string, unknown> | undefined;
    structuredContent?: Record<string, unknown> | undefined;
}): EmbeddedReport | null =>
    ((result._meta?.[REPORT_META_KEY] ?? result.structuredContent?.report) as
        EmbeddedReport | undefined) ?? null;

const element = document.getElementById('root');
if (element) {
    const root = createRoot(element);
    const embedded = readEmbedded();
    if (embedded || window.parent === window) {
        render(root, embedded, 'レポートのデータがありません');
    } else {
        render(root, null, 'レポートを読み込んでいます…');
        const app = new App({ name: 'sf-metascope-report', version: '0.1.0' });
        app.ontoolresult = (result) =>
            render(
                root,
                reportOfResult(result),
                'レポートを作れませんでした (build_report の結果を確かめてください)',
            );
        app.connect().catch((error: unknown) =>
            render(root, null, `MCP Apps のホストに接続できませんでした: ${String(error)}`),
        );
    }
}
