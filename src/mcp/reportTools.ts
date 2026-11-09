import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { REPORT_PROVIDERS, type ReportProviderName, runReportProvider } from '../analyzer/report';
import type { RepositoryProcessor } from '../analyzer/unit/processor';

// レポートのデータ (provider) を返す MCP のツール。AI に渡すデータなので、機密になりうる値は必ず伏せる
// (report/mask.ts)。方針: docs/analysis-plan.md 5.7・docs/report-components-plan.md

const text = (value: unknown) => ({
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
});

export const registerReportTools = (server: McpServer, processor: RepositoryProcessor): void => {
    server.registerTool(
        'list_report_providers',
        {
            description:
                'レポートのデータの provider の名前の一覧を返します (get_report_data に渡す名前)',
            inputSchema: {},
        },
        async () => text(Object.keys(REPORT_PROVIDERS).sort()),
    );

    server.registerTool(
        'get_report_data',
        {
            description:
                'レポートのデータを provider の名前で取得します。保存した前回の解析結果があれば、前回からの差分 (各行の status) も返します。機密になりうる値 (指定ログイン情報の URL など) は伏せます',
            inputSchema: {
                provider: z.string().min(1),
                args: z.record(z.string(), z.unknown()).optional(),
                /** true なら、リポジトリを読み直してから返す */
                reload: z.boolean().optional(),
            },
        },
        async ({ provider, args, reload }) => {
            if (!(provider in REPORT_PROVIDERS)) {
                return text({
                    error: `Unknown provider: ${provider}`,
                    providers: Object.keys(REPORT_PROVIDERS),
                });
            }
            if (reload) await processor.reset();
            return text(
                runReportProvider(provider as ReportProviderName, processor.getReportInput(), args),
            );
        },
    );
};
