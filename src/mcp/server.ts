import fs from 'node:fs/promises';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { MetadataProcessor } from '../processor/metadata';
import { renderMetadataResult } from '../renderer/metadata';

const repositoryRoot = path.resolve(process.cwd());
const reportModeSchema = z.enum(['snapshot', 'diff']);

const createMetadataProcessor = async (repositoryRoot: string): Promise<MetadataProcessor> => {
    const baseName = path.basename(repositoryRoot);
    const saveRoot = path.join('.sf-metascope', baseName);

    const processor = MetadataProcessor.create(repositoryRoot, saveRoot);
    await fs.mkdir(saveRoot, { recursive: true });

    return processor;
};

const getRepositoryName = (baseDir: string): string => {
    const resolvedBaseDir = path.resolve(baseDir);
    const repositoryName = path.basename(resolvedBaseDir);

    if (!repositoryName || repositoryName === '.' || repositoryName === '..') {
        throw new Error('baseDirから作業リポジトリ名を取得できません');
    }

    return repositoryName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const getStorageRoot = (baseDir: string): string =>
    path.join(repositoryRoot, getRepositoryName(baseDir), '.sf-metascope');

const getObjectDir = (baseDir: string): string => path.join(path.resolve(baseDir));

const assertObjectDir = async (baseDir: string): Promise<string> => {
    const objectDir = getObjectDir(baseDir);
    try {
        const stats = await fsp.stat(objectDir);
        if (!stats.isDirectory()) {
            throw new Error(`Salesforceオブジェクトディレクトリが見つかりません: ${objectDir}`);
        }
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('Salesforceオブジェクト')) {
            throw error;
        }
        throw new Error(`Salesforceオブジェクトディレクトリが見つかりません: ${objectDir}`);
    }
    return objectDir;
};

const getSnapshotDir = (baseDir: string): string =>
    path.join(getStorageRoot(baseDir), 'snapshots', 'latest');

const getAnalysisObjectsDir = (baseDir: string): string =>
    path.join(getStorageRoot(baseDir), 'analyses', 'objects');

const initializeWorkspace = async (baseDir: string): Promise<string> => {
    const objectDir = await assertObjectDir(baseDir);
    await fsp.mkdir(path.join(getSnapshotDir(baseDir), 'objects'), { recursive: true });
    await fsp.mkdir(getAnalysisObjectsDir(baseDir), { recursive: true });
    return objectDir;
};

const hasSnapshot = async (baseDir: string): Promise<boolean> => {
    const snapshotObjectsDir = path.join(getSnapshotDir(baseDir), 'objects');
    try {
        const entries = await fsp.readdir(snapshotObjectsDir, { withFileTypes: true });
        return entries.length > 0;
    } catch {
        return false;
    }
};

const writeObjectResults = async (baseDir: string, processor: MetadataProcessor): Promise<void> => {
    const outputDir = getAnalysisObjectsDir(baseDir);
    await fsp.mkdir(outputDir, { recursive: true });

    const currentApiNames = new Set(
        processor.getMetadataObjectDiffs().map((objectDiff) => objectDiff.apiName),
    );
    const existingFiles = await fsp.readdir(outputDir, { withFileTypes: true });
    for (const entry of existingFiles) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) {
            continue;
        }
        const apiName = entry.name.slice(0, -'.json'.length);
        if (!currentApiNames.has(apiName)) {
            await fsp.unlink(path.join(outputDir, entry.name));
        }
    }

    for (const objectDiff of processor.getMetadataObjectDiffs()) {
        const outputPath = path.join(outputDir, `${objectDiff.apiName}.json`);
        await fsp.writeFile(outputPath, JSON.stringify(objectDiff, null, 2), 'utf8');
    }
};

const updateSnapshot = async (baseDir: string, objectDir: string): Promise<void> => {
    const snapshotDir = path.join(getSnapshotDir(baseDir), 'objects');
    await fsp.rm(snapshotDir, { recursive: true, force: true });
    await fsp.mkdir(path.dirname(snapshotDir), { recursive: true });
    await fsp.cp(objectDir, snapshotDir, { recursive: true });
};

const createProcessor = async (
    baseDir: string,
    mode: 'snapshot' | 'diff',
): Promise<MetadataProcessor> => {
    const objectDir = await assertObjectDir(baseDir);
    const snapshotObjectsDir = path.join(getSnapshotDir(baseDir), 'objects');
    const previousDir =
        mode === 'snapshot' ? path.join(getStorageRoot(baseDir), 'empty') : snapshotObjectsDir;
    return MetadataProcessor.create(previousDir, objectDir);
};

const createServer = (context: any): McpServer => {
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
            await fsp.mkdir(path.dirname(reportPath), { recursive: true });
            await fsp.writeFile(
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
    await fsp.stat(repositoryRoot);

    const configuredBaseDir = process.env.SF_METASCOPE_BASE_DIR;
    if (configuredBaseDir) {
        await initializeWorkspace(configuredBaseDir);
    }

    return createServer();
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
