import { defineConfig } from 'vite';
import ttsc from '@ttsc/unplugin/vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
    root: path.resolve(__dirname, 'src/viewer'),
    plugins: [ttsc(), react(), viteSingleFile()],
    build: {
        outDir: path.resolve(__dirname, 'dist/viewer'),
        emptyOutDir: false,
    },
});

