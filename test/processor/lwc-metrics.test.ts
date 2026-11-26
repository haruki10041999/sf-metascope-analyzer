import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseLwcBundleFolder } from '../../src/analyzer/parser/Lwc/bundle';
import type { LwcBundleFile } from '../../src/analyzer/parser/Lwc/folder';
import { lwcMetricsOf } from '../../src/analyzer/processor/Lwc/metrics';

// LWC の本体ごとのメトリクス (processor/Lwc/metrics.ts。数え方は Apex と共通の commons/metrics.ts)。
// 期待する値は、commons/metrics.ts の冒頭の数え方で手で数えたもの

const moduleOf = (name: string, js: string) => {
    const files: LwcBundleFile[] = [
        { fileType: 'module', fileName: `${name}.js`, filePath: `${name}/${name}.js`, source: js },
        {
            fileType: 'template',
            fileName: `${name}.html`,
            filePath: `${name}/${name}.html`,
            source: '<template></template>',
        },
    ];
    const bundle = parseLwcBundleFolder({ name, bundleDir: name, files, skippedFiles: [] });
    assert.equal(bundle.dataType, 'lwcBundle', JSON.stringify(bundle.resolvedError));
    if (bundle.dataType !== 'lwcBundle') throw new Error('not parsed');
    const main = bundle.result.base.modules.find((m) => m.main)?.module;
    assert.ok(main);
    return main;
};

describe('processor/Lwc/metrics.ts の lwcMetricsOf', () => {
    it('循環的複雑度・認知的複雑度・文の数・ネスト・Apex の呼び出し・イベントを数える', () => {
        const module = moduleOf(
            'metrics',
            [
                "import { LightningElement } from 'lwc';",
                "import getAccounts from '@salesforce/apex/AccountController.getAccounts';",
                'export default class Metrics extends LightningElement {',
                '    items = [];',
                '    async load(ids) {',
                '        for (const id of ids) {',
                '            if (id && this.items.length > 0) {',
                '                await getAccounts({ id });',
                '            } else {',
                '                this.items.push(id);',
                '            }',
                '        }',
                '        try {',
                "            this.dispatchEvent(new CustomEvent('done'));",
                '        } catch (e) {',
                "            const message = e ? e.message : 'x';",
                '        }',
                '        [1, 2].forEach((n) => { if (n) { this.x = n; } });',
                '    }',
                '}',
            ].join('\n'),
        );
        const load = lwcMetricsOf(module).find((m) => m.member === 'load')!;
        assert.ok(load);
        assert.deepEqual(
            {
                cyclomatic: load.cyclomatic,
                cognitive: load.cognitive,
                statements: load.statements,
                maxNesting: load.maxNesting,
            },
            {
                // 1 + for + if + && + catch + 三項 + コールバックの中の if
                cyclomatic: 7,
                // for 1 + if 2 (深さ 1) + && 1 + else 1 + catch 1 + 三項 2 (catch の中) + コールバックの中の if 2 (中の関数で深さ 1)
                cognitive: 10,
                statements: 10,
                // for の中の if (コールバックは文の入れ子に数えない)
                maxNesting: 2,
            },
        );
        assert.deepEqual(
            [load.apexCalls, load.apexCallsInLoop, load.events, load.calls],
            [1, 1, 1, 2],
        );
        assert.ok(load.callees.includes('AccountController.getAccounts'));
    });
});
