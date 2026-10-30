import { defineConfig } from 'vite';
import ttsc from '@ttsc/unplugin/vite';
import path from 'path';

/**
 * node で直接実行するためのビルド (ttsx を使わずに動かす用)。
 * preserveModules で src と同じ構成のまま出力するため、
 * worker_threads のエントリ (apexThread.js) も呼び出し元の隣に置かれ、相対 URL で解決できる。
 * node_modules の依存は SSR ビルドの既定どおり外部参照のまま残す。
 */
export default defineConfig({
    plugins: [ttsc()],
    build: {
        ssr: true,
        target: 'node22',
        outDir: path.resolve(__dirname, 'dist/node'),
        emptyOutDir: true,
        rollupOptions: {
            input: [
                path.resolve(__dirname, 'src/index.ts'),
                path.resolve(__dirname, 'src/mcp/server.ts'),
                path.resolve(__dirname, 'src/analyzer/worker/apexThread.ts'),
            ],
            output: {
                format: 'es',
                preserveModules: true,
                preserveModulesRoot: path.resolve(__dirname, 'src'),
                entryFileNames: '[name].js',
            },
        },
    },
});
