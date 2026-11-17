import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerAppResources } from './appResources';
import { registerCatalogResources } from './catalogResources';
import {
    type ProcessorSource,
    SERVER_INSTRUCTIONS,
    makeProcessorLoader,
    resolveServerConfig,
} from './context';
import { registerDependencyTools } from './dependencyTools';
import { registerNodeTools } from './nodeTools';
import { registerReportPrompts } from './prompts';
import { registerReportTools } from './reportTools';

// MCP のサーバー。設定は環境変数 (context.ts の resolveServerConfig)。
// 接続を先にし、リポジトリの読み込みは裏で進める (docs/implementation-roadmap.md 4.5)

/** サーバーを作る (ツールは source の読み込みを待つ) */
const createServer = (source: ProcessorSource): McpServer => {
    const server = new McpServer(
        { name: 'sf-metascope-analyzer', version: '0.1.0' },
        { instructions: SERVER_INSTRUCTIONS },
    );
    registerReportTools(server, source);
    registerDependencyTools(server, source);
    registerNodeTools(server, source);
    registerCatalogResources(server);
    registerAppResources(server);
    registerReportPrompts(server);
    return server;
};

const main = async (): Promise<void> => {
    const config = await resolveServerConfig();
    const loadProcessor = makeProcessorLoader(config);
    const server = createServer(loadProcessor);
    await server.connect(new StdioServerTransport());
    // 接続のあとで読み込みを始める (失敗しても、次のツールの呼び出しでやり直す)。stdout は MCP が使うので stderr に出す
    loadProcessor().catch((error: unknown) => {
        console.error('リポジトリの読み込みに失敗しました:', error);
    });
};

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
