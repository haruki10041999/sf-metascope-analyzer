import fs from 'node:fs/promises';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { MetadataProcessor } from '../analyzer/processor/Metadata/metadata';
import { MetadataDependencyProcessor } from '../analyzer/processor/Metadata/dependency';

import type { BuildReportOptions } from '../builder/htmlBuilder';
import { buildReportHtml } from '../builder/htmlBuilder';

const repositoryRoot = path.resolve(process.cwd());

type MetadataContext = {
    metadata: MetadataProcessor;
    dependency: MetadataDependencyProcessor;
};

type AppContext = {
    repogitoryRoot: string;
    saveRoot: string;
    metadataContext: MetadataContext;
};

const createMetadataContext = async (
    repositoryRoot: string,
    saveRoot: string,
): Promise<MetadataContext> => {
    const baseName = path.basename(repositoryRoot);
    const saveResultPath = path.join(saveRoot, baseName);

    const metadataProcessor = await MetadataProcessor.create(saveRoot, repositoryRoot);

    try {
        await fs.access(saveResultPath);
    } catch {
        await metadataProcessor.save();
    }

    const dependencyProcessor = new MetadataDependencyProcessor(
        metadataProcessor.getMetadataObjectDiffs(),
    );

    return {
        metadata: metadataProcessor,
        dependency: dependencyProcessor,
    };
};

const createServer = (context: AppContext): McpServer => {
    const server = new McpServer({
        name: 'sf-metascope-analyzer',
        version: '0.1.0',
    });

    server.registerTool(
        'save_objects',
        {
            description: 'Objectの結果を保存します',
            inputSchema: {},
            outputSchema: {
                message: z.string().min(1),
            },
        },
        async () => {
            try {
                await context.metadataContext.metadata.save();
                context.metadataContext.dependency.reset(
                    context.metadataContext.metadata.getMetadataObjectDiffs(),
                );

                const result = {
                    message: '成功しました',
                };

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result),
                        },
                    ],
                    structuredContent: result,
                };
            } catch (error) {
                const result = {
                    message: `失敗しました：${error}`,
                };

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result),
                        },
                    ],
                    structuredContent: result,
                };
            }
        },
    );

    server.registerTool(
        'analyze_objects',
        {
            description: 'Objectの解析結果を算出します。',
            inputSchema: {
                baseDir: z.string().min(1),
                isDiff: z.boolean(),
                targetObjectApiNames: z
                    .object({
                        targetObjectApiNames: z.array(z.string()),
                        depth: z.number().min(1).default(1),
                    })
                    .optional(),
            },
            outputSchema: {
                message: z.string().min(1),
                outputPath: z.string().min(1),
            },
        },
        async ({ baseDir, isDiff, targetObjectApiNames }) => {
            const metadata = isDiff
                ? targetObjectApiNames
                    ? context.metadataContext.metadata.getRelatedMetadataObjectsDiff(
                          targetObjectApiNames.targetObjectApiNames,
                          targetObjectApiNames.depth,
                      )
                    : context.metadataContext.metadata.getMetadataObjectDiffs()
                : targetObjectApiNames
                  ? context.metadataContext.metadata.getRelatedMetadataObjects(
                        targetObjectApiNames.targetObjectApiNames,
                        targetObjectApiNames.depth,
                    )
                  : context.metadataContext.metadata.getMetadataObjects();

            const dependency = isDiff
                ? targetObjectApiNames
                    ? context.metadataContext.dependency.getDependencyDiff(
                          targetObjectApiNames.targetObjectApiNames,
                          targetObjectApiNames.depth,
                      )
                    : context.metadataContext.dependency.getAllDependencyDiff()
                : targetObjectApiNames
                  ? context.metadataContext.dependency.getDependency(
                        targetObjectApiNames.targetObjectApiNames,
                        targetObjectApiNames.depth,
                    )
                  : context.metadataContext.dependency.getAllDependency();

            const builderOption: BuildReportOptions = {
                title: 'metadata解析レポート',
                metadata: {
                    type: 'metadata',
                    metadata,
                    dependency,
                },
                outputPath: baseDir,
            };

            try {
                const outputPath = await buildReportHtml(builderOption);

                const result = {
                    message: '成功しました',
                    outputPath,
                };

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result),
                        },
                    ],
                    structuredContent: result,
                };
            } catch (error) {
                const result = {
                    message: `失敗しました：${error}`,
                    outputPath: baseDir,
                };

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result),
                        },
                    ],
                    structuredContent: result,
                };
            }
        },
    );

    return server;
};

const initializeServer = async (): Promise<McpServer> => {
    await fs.stat(repositoryRoot);

    const configuredBaseDir = process.env.SF_METASCOPE_BASE_DIR!;

    const metadataContext = await createMetadataContext(repositoryRoot, configuredBaseDir);

    return createServer({
        repogitoryRoot: repositoryRoot,
        saveRoot: configuredBaseDir,
        metadataContext: metadataContext,
    });
};

const main = async (): Promise<void> => {
    const server = await initializeServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
};

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
