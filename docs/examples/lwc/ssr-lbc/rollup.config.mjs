// lightning-base-components を SSR でビルドする設定 (docs/lwc-snapshot-plan.md 2 章)
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import lwc from '@lwc/rollup-plugin';

const here = path.dirname(fileURLToPath(import.meta.url));

export default {
    input: path.join(here, 'entry.js'),
    output: { file: path.join(here, 'dist', 'out.mjs'), format: 'esm', inlineDynamicImports: true },
    external: ['@lwc/engine-server', /^node:/],
    plugins: [
        {
            name: 'ssr',
            resolveId(id) {
                // SSR では lwc を @lwc/engine-server に向ける
                if (id === 'lwc') return { id: '@lwc/engine-server', external: true };
                return null;
            },
            // lightning-base-components は import.meta.env.SSR (Vite の書き方) で SSR かどうかを見る
            transform(code) {
                return code.includes('import.meta.env')
                    ? code
                          .replaceAll('import.meta.env.SSR', 'true')
                          .replaceAll('import.meta.env', '({})')
                    : null;
            },
        },
        lwc({
            rootDir: here,
            modules: [{ dir: 'modules' }, { npm: 'lightning-base-components' }],
            // lightning-base-components は lwc:is (動的コンポーネント) を使う
            enableDynamicComponents: true,
        }),
    ],
    onwarn(warning, warn) {
        if (!['CIRCULAR_DEPENDENCY', 'THIS_IS_UNDEFINED'].includes(warning.code)) warn(warning);
    },
};
