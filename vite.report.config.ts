import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * レポートの viewer を 1 つの HTML (dist/viewer/report.html) にする (docs/implementation-roadmap.md 4.4)。
 * レポートを作るときは、この HTML に文書を差し込むだけにする (実行時に Vite を使わない)
 */
export default defineConfig({
    root: path.resolve(import.meta.dirname, 'src/viewer/report'),
    plugins: [react(), tailwindcss(), viteSingleFile()],
    build: {
        outDir: path.resolve(import.meta.dirname, 'dist/viewer/report'),
        emptyOutDir: true,
    },
});
