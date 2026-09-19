import { build } from 'vite';
import path from 'path';

import { Prop } from '../viewer/types';

// 各種メタデータに対応できるよう共用体型にしておくと柔軟です
export interface BuildReportOptions {
    title: string;
    metadata: Prop;
    outputPath: string;
}

export async function buildReportHtml(options: BuildReportOptions): Promise<string> {
    const rootDir = process.cwd();
    const viewerDir = path.resolve(rootDir, 'src/viewer');
    const absoluteOutputPath = path.resolve(rootDir, options.outputPath);

    const outputDir = path.dirname(absoluteOutputPath);
    const outputFileName = path.basename(absoluteOutputPath);

    // Vite ビルド時に直接値をコンパイル注入
    await build({
        root: viewerDir,
        define: {
            // JSON.stringify して文字列定数としてコード中に直接展開
            __METASCOPE_TITLE_DEFINE__: JSON.stringify(options.title),
            __METASCOPE_METADATA_DEFINE__: JSON.stringify(options.metadata),
        },
        build: {
            outDir: outputDir,
            emptyOutDir: false,
            rollupOptions: {
                output: {
                    entryFileNames: outputFileName, // index.html ではなく目的のファイル名で直接出力
                },
            },
        },
        logLevel: 'warn',
    });

    return absoluteOutputPath;
}
