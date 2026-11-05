/**
 * LWC のサンプルすべての解析結果 (JSON) を出力する。本番と同じ LwcParser.parseLwcBundle
 * (バンドルのフォルダを 1 回読み、JS / TS・HTML・CSS・js-meta.xml をまとめて解析) を通す。
 *
 * - output/json/<グループ>/<バンドル名>.json: LwcBundleParseResult
 * - output/json/index.md:                     バンドルごとのノード数・resolvedError の数
 *
 * 実行: npx ttsx --noCheck docs/examples/lwc/scripts/generate-json.ts
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LwcParser } from '../../../../src/analyzer/parser/Lwc/parser';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const samples = path.resolve(here, '../samples');
const outputDirectory = path.resolve(here, '../output/json');
const rel = (p: string) => path.relative(root, p).replace(/\\/g, '/');

/** グループ名 → バンドルの親フォルダ (直下のフォルダがバンドル) */
const GROUPS: Record<string, string> = {
    bundles: 'bundles/force-app/main/default/lwc',
    'diff-before': 'diff/before',
    'diff-after': 'diff/after',
};

/** kind を持つ JSON ノードの数 */
const countNodes = (value: unknown): number => {
    if (Array.isArray(value)) return value.reduce((sum: number, v) => sum + countNodes(v), 0);
    if (typeof value !== 'object' || value === null) return 0;
    const own = typeof (value as { kind?: unknown }).kind === 'string' ? 1 : 0;
    return (
        own +
        Object.entries(value)
            .filter(([key]) => key !== 'sourceKeys')
            .reduce((sum, [, v]) => sum + countNodes(v), 0)
    );
};

const rows: string[] = [];
await rm(outputDirectory, { recursive: true, force: true });
for (const [group, directory] of Object.entries(GROUPS)) {
    const entries = await readdir(path.join(samples, directory), { withFileTypes: true });
    for (const name of entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort()) {
        const result = await LwcParser.parseLwcBundle(path.join(samples, directory, name));
        const file = path.join(outputDirectory, group, `${name}.json`);
        await mkdir(path.dirname(file), { recursive: true });
        // 出力をマシンに依存させないため、パスはリポジトリからの相対にする
        await writeFile(
            file,
            `${JSON.stringify({ ...result, filePath: rel(result.filePath) }, null, 2)}\n`,
        );
        rows.push(
            `| ${group} | [${name}](${group}/${name}.json) | ${result.dataType} | ${countNodes(result.result.base)} | ${result.resolvedError.length} |`,
        );
        console.log(`${group.padEnd(12)} ${name}`);
    }
}
await writeFile(
    path.join(outputDirectory, 'index.md'),
    [
        '# LWC のサンプルの JSON',
        '',
        '`npx ttsx --noCheck docs/examples/lwc/scripts/generate-json.ts` で生成。ノード数は kind を持つ JSON ノードの数。',
        '',
        '| グループ | バンドル | dataType | ノード数 | resolvedError |',
        '| --- | --- | --- | ---: | ---: |',
        ...rows,
        '',
    ].join('\n'),
);
