import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
    root: path.resolve(__dirname, 'src/viewer'),
    plugins: [react(), viteSingleFile()],
    build: {
        outDir: path.resolve(__dirname, 'output'),
        emptyOutDir: false,
    },
});
