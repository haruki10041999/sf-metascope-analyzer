import { type McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
    buildReportCatalog,
    componentMarkdown,
    findCatalogComponent,
    findCatalogProvider,
    providerMarkdown,
    reportCatalogMarkdown,
    reportCatalogSummaryMarkdown,
} from '../report/llmCatalog';

// レポートのカタログを MCP のリソースとしても出す (docs/implementation-roadmap.md 4.5)。
// ツールを使わないクライアントでも読めるように、ツール (list_report_components など) と同じ中身を出す

const MARKDOWN = 'text/markdown';

const markdown = (uri: URL, text: string) => ({
    contents: [{ uri: uri.href, mimeType: MARKDOWN, text }],
});

const variable = (value: string | string[] | undefined) =>
    decodeURIComponent(Array.isArray(value) ? (value[0] ?? '') : (value ?? ''));

export const registerCatalogResources = (server: McpServer): void => {
    server.registerResource(
        'report-catalog',
        'metascope://catalog',
        {
            title: 'レポートのカタログ (概要)',
            description: 'レポートの書き方の決まりと、部品・provider の一覧',
            mimeType: MARKDOWN,
        },
        async (uri) => markdown(uri, reportCatalogSummaryMarkdown()),
    );

    server.registerResource(
        'report-catalog-full',
        'metascope://catalog/full',
        {
            title: 'レポートのカタログ (全体)',
            description: '部品の props・provider の引数と出力のスキーマを含むカタログ全体 (大きい)',
            mimeType: MARKDOWN,
        },
        async (uri) => markdown(uri, reportCatalogMarkdown()),
    );

    server.registerResource(
        'report-document-schema',
        'metascope://schema/report-document',
        {
            title: 'レポートの文書の JSON Schema',
            description:
                'build_report・validate_report_spec に渡す文書 ({ title, data, spec }) の形',
            mimeType: 'application/schema+json',
        },
        async (uri) => ({
            contents: [
                {
                    uri: uri.href,
                    mimeType: 'application/schema+json',
                    text: JSON.stringify(buildReportCatalog().documentSchema, null, 2),
                },
            ],
        }),
    );

    server.registerResource(
        'report-component',
        new ResourceTemplate('metascope://catalog/components/{name}', {
            list: async () => ({
                resources: buildReportCatalog().components.map((component) => ({
                    uri: `metascope://catalog/components/${component.name}`,
                    name: component.name,
                    description: component.description,
                    mimeType: MARKDOWN,
                })),
            }),
        }),
        {
            title: 'レポートの部品',
            description: '部品の説明と props のスキーマ',
            mimeType: MARKDOWN,
        },
        async (uri, variables) => {
            const component = findCatalogComponent(variable(variables.name));
            return markdown(
                uri,
                component
                    ? componentMarkdown(component)
                    : `Unknown component: ${variable(variables.name)}`,
            );
        },
    );

    server.registerResource(
        'report-provider',
        new ResourceTemplate('metascope://catalog/providers/{name}', {
            list: async () => ({
                resources: buildReportCatalog().providers.map((provider) => ({
                    uri: `metascope://catalog/providers/${provider.name}`,
                    name: provider.name,
                    description: provider.description,
                    mimeType: MARKDOWN,
                })),
            }),
        }),
        {
            title: 'レポートの provider',
            description: 'provider の説明と、引数・出力のスキーマ',
            mimeType: MARKDOWN,
        },
        async (uri, variables) => {
            const provider = findCatalogProvider(variable(variables.name));
            return markdown(
                uri,
                provider
                    ? providerMarkdown(provider)
                    : `Unknown provider: ${variable(variables.name)}`,
            );
        },
    );
};
