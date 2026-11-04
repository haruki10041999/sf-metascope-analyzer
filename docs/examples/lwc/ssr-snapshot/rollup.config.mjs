// LWC を @lwc/engine-server で HTML にする試作のビルド設定 (docs/lwc-snapshot-plan.md)
// 実行 (リポジトリのルートで): npx rollup -c docs/examples/lwc/ssr-snapshot/rollup.config.mjs && node docs/examples/lwc/ssr-snapshot/dist/out.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import lwc from '@lwc/rollup-plugin';

const here = path.dirname(fileURLToPath(import.meta.url));

export default {
    input: path.join(here, 'entry.js'),
    output: { file: path.join(here, 'dist', 'out.mjs'), format: 'esm' },
    external: ['@lwc/engine-server'],
    plugins: [
        {
            name: 'salesforce-stubs',
            resolveId(id) {
                // @lwc/rollup-plugin は既定で lwc を @lwc/engine-dom (ブラウザ用) に解決するので、SSR 用に向け直す
                if (id === 'lwc') return { id: '@lwc/engine-server', external: true };
                // @salesforce/apex/* はモックの wire adapter にする
                if (id.startsWith('@salesforce/apex/')) return path.join(here, 'mocks', 'apex.js');
                return null;
            },
        },
        // モックは LWC のコンポーネントとして変換しない
        lwc({ rootDir: here, modules: [{ dir: 'modules' }], exclude: ['**/mocks/**'] }),
    ],
};
