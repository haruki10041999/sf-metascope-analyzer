import fs from 'node:fs/promises';

import { RESOURCE_MIME_TYPE, registerAppResource } from '@modelcontextprotocol/ext-apps/server';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { defaultReportTemplate } from '../builder/reportBuilder';

// MCP Apps (docs/implementation-roadmap.md 4.5): build_report の結果を、クライアントの中の画面 (iframe) で見せる。
// 画面は事前にビルドした viewer の HTML (dist/viewer/report/index.html) そのもの。
// HTML に文書が埋め込まれていないときは、viewer が MCP Apps の App で接続し、ツールの結果の _meta からレポートを受け取る
// (src/viewer/report/main.tsx)

/** レポートの画面のリソース */
export const REPORT_UI_URI = 'ui://metascope/report.html';

export { REPORT_META_KEY } from '../report/embedding';

export type AppResourceOptions = {
    /** 事前にビルドした viewer の HTML (既定は dist/viewer/report/index.html。テストで差し替える) */
    templatePath?: string;
};

export const registerAppResources = (server: McpServer, options: AppResourceOptions = {}): void => {
    registerAppResource(
        server,
        'Metascope report',
        REPORT_UI_URI,
        { description: 'build_report のレポートを表示する画面' },
        async () => {
            const html = await fs.readFile(options.templatePath ?? defaultReportTemplate(), 'utf8');
            return {
                contents: [{ uri: REPORT_UI_URI, mimeType: RESOURCE_MIME_TYPE, text: html }],
            };
        },
    );
};
