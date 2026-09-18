import fs from 'node:fs/promises';
import path, { basename } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { MetadataProcessor } from '../analyzer/processor/Metadata/metadata';
import { MetadataDependencyProcessor } from '../analyzer/processor/Metadata/dependency';
import { renderMetadataResult } from '../renderer/metadata';

type AppContext = {
    repogitoryRoot: string;
    saveRoot: string;
};

const createMetadataProcessor = async (
    repositoryRoot: string,
    saveRoot: string,
): Promise<MetadataProcessor> => {
    const baseName = path.basename(repositoryRoot);
    const saveResultPath = path.join(saveRoot, baseName);

    const processor = await MetadataProcessor.create(saveRoot, repositoryRoot);

    try {
        await fs.access(saveResultPath);
    } catch {
        await processor.save();
    }

    const dependencyProcessor = new MetadataDependencyProcessor(processor.getMetadataObjectDiffs());

    return processor;
};

const createServer = (context?: any): McpServer => {
    const server = new McpServer({
        name: 'sf-metascope-analyzer',
        version: '0.1.0',
    });

    server.registerTool(
        'analyze_objects',
        {
            description: 'Salesforceオブジェクトをsnapshotまたはdiffモードで解析します',
            inputSchema: {
                baseDir: z.string().min(1),
                mode: reportModeSchema,
            },
        },
        async ({ baseDir, mode }) => {
            const objectDir = await initializeWorkspace(baseDir);
            const snapshotObjectsDir = path.join(getSnapshotDir(baseDir), 'objects');
            const snapshotExists = await hasSnapshot(baseDir);
            const effectiveMode = mode === 'diff' && snapshotExists ? 'diff' : 'snapshot';
            const processor = await MetadataProcessor.create(
                effectiveMode === 'diff'
                    ? snapshotObjectsDir
                    : path.join(getStorageRoot(baseDir), 'empty'),
                objectDir,
            );

            if (effectiveMode === 'snapshot') {
                await updateSnapshot(baseDir, objectDir);
            }

            await writeObjectResults(baseDir, processor);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                baseDir: path.resolve(baseDir),
                                requestedMode: mode,
                                mode: effectiveMode,
                                initialSave: !snapshotExists,
                                objectCount: processor.getMetadataObjectDiffs().length,
                            },
                            null,
                            2,
                        ),
                    },
                ],
            };
        },
    );

    server.registerTool(
        'render_object_report',
        {
            description: '指定リポジトリのオブジェクト解析結果をHTMLへ出力します',
            inputSchema: {
                baseDir: z.string().min(1),
                mode: reportModeSchema,
            },
        },
        async ({ baseDir, mode }) => {
            await initializeWorkspace(baseDir);
            const processor = await createProcessor(baseDir, mode);
            const reportPath = path.join(getStorageRoot(baseDir), 'analyses', 'report.html');
            await fs.mkdir(path.dirname(reportPath), { recursive: true });
            await fs.writeFile(
                reportPath,
                renderMetadataResult(processor.getMetadataObjectDiffs()),
                'utf8',
            );

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                baseDir: path.resolve(baseDir),
                                mode,
                                reportPath,
                            },
                            null,
                            2,
                        ),
                    },
                ],
            };
        },
    );

    return server;
};

const initializeServer = async (): Promise<McpServer> => {
    await fs.stat(repositoryRoot);

    const configuredBaseDir = process.env.SF_METASCOPE_BASE_DIR;
    if (configuredBaseDir) {
        await initializeWorkspace(configuredBaseDir);
    }

    return createServer(undefined);
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
