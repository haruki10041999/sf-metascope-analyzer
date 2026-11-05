/**
 * Apex のサンプルすべての解析結果 (JSON) を出力する。本番と同じ ApexParser.parseApexUnits
 * (フォルダごとにソースと -meta.xml を単位にまとめ、parse → IR → converter → JSON) を通す。
 *
 * - output/json/<グループ>/<id>.json: ApexUnitParseResult (id は class_<名前> / trigger_<名前> / anonymous_<名前>)
 * - output/json/index.md:             単位ごとのノード数・resolvedError の数
 *
 * 実行: npx ttsx --noCheck docs/examples/apex/scripts/generate-json.ts
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ApexParser } from '../../../../src/analyzer/parser/Apex/parser';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const samples = path.resolve(here, '../samples');
const outputDirectory = path.resolve(here, '../output/json');
const rel = (p: string) => path.relative(root, p).replace(/\\/g, '/');

/** グループ名 → サンプルのフォルダ */
const GROUPS: Record<string, string> = {
    syntax: 'syntax',
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
    for (const result of await ApexParser.parseApexUnits(path.join(samples, directory))) {
        const id = result.result.id;
        const file = path.join(outputDirectory, group, `${id}.json`);
        await mkdir(path.dirname(file), { recursive: true });
        // 出力をマシンに依存させないため、パスはリポジトリからの相対にする
        await writeFile(
            file,
            `${JSON.stringify({ ...result, filePath: rel(result.filePath) }, null, 2)}\n`,
        );
        rows.push(
            `| ${group} | [${id}](${group}/${id}.json) | ${countNodes(result.result.base)} | ${result.resolvedError.length} |`,
        );
        console.log(`${group.padEnd(12)} ${id}`);
    }
}
await writeFile(
    path.join(outputDirectory, 'index.md'),
    [
        '# Apex のサンプルの JSON',
        '',
        '`npx ttsx --noCheck docs/examples/apex/scripts/generate-json.ts` で生成。ノード数は kind を持つ JSON ノードの数。',
        '',
        '| グループ | 単位 | ノード数 | resolvedError |',
        '| --- | --- | ---: | ---: |',
        ...rows,
        '',
    ].join('\n'),
);
