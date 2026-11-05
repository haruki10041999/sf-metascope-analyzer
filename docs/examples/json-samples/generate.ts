/**
 * サンプルコードすべての解析結果 (JSON) を出力する。Apex は ApexParser.parseApexFile、LWC は LwcParser.parseLwcBundle で、
 * 本番と同じ流れ (parse → IR → converter → JSON) を通す。
 *
 * - output/apex/<グループ>/<ファイル名>.json: ApexParseResult (メタデータ XML は ApexMetaParseResult)
 * - output/lwc/<グループ>/<バンドル名>.json:  LwcBundleParseResult
 * - output/index.md:                          サンプルごとの dataType・ノード数・resolvedError の数
 *
 * 実行: npx ttsx --noCheck docs/examples/json-samples/generate.ts
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ApexParser } from '../../../src/analyzer/parser/Apex/parser';
import { LwcParser } from '../../../src/analyzer/parser/Lwc/parser';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const outputDirectory = path.join(here, 'output');
const rel = (p: string) => path.relative(root, p).replace(/\\/g, '/');

/** Apex のサンプル: グループ名 → フォルダ (直下の .cls / .trigger / .apex / -meta.xml) */
const APEX_GROUPS: Record<string, string> = {
    'apex-ir': 'docs/examples/apex-ir',
    'apex-diff-before': 'docs/examples/apex-diff/before',
    'apex-diff-after': 'docs/examples/apex-diff/after',
};

/** LWC のサンプル: グループ名 → バンドルの親フォルダ (直下のフォルダがバンドル) */
const LWC_GROUPS: Record<string, string> = {
    bundles: 'docs/examples/lwc/bundles/force-app/main/default/lwc',
    'lwc-diff-before': 'docs/examples/lwc-diff/before',
    'lwc-diff-after': 'docs/examples/lwc-diff/after',
    'ssr-snapshot': 'docs/examples/lwc/ssr-snapshot/modules/c',
    'ssr-lbc': 'docs/examples/lwc/ssr-lbc/modules/c',
};

const APEX_FILE = /\.(cls|trigger|apex)(-meta\.xml)?$/i;

type Row = { group: string; name: string; dataType: string; nodes: number; errors: number };

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

const write = async (file: string, result: { filePath: string; dataType: string }) => {
    await mkdir(path.dirname(file), { recursive: true });
    // 出力をマシンに依存させないため、パスはリポジトリからの相対にする
    const portable = { ...result, filePath: rel(path.resolve(root, result.filePath)) };
    await writeFile(file, `${JSON.stringify(portable, null, 2)}\n`);
};

const main = async () => {
    await rm(outputDirectory, { recursive: true, force: true });
    const rows: Row[] = [];

    for (const [group, directory] of Object.entries(APEX_GROUPS)) {
        const files = (await readdir(path.join(root, directory))).filter((f) => APEX_FILE.test(f));
        for (const file of files.sort()) {
            const result = await ApexParser.parseApexFile(path.join(root, directory, file));
            await write(path.join(outputDirectory, 'apex', group, `${file}.json`), result);
            rows.push({
                group: `apex/${group}`,
                name: file,
                dataType: result.dataType,
                nodes: countNodes(result.result.base),
                errors: result.resolvedError.length,
            });
        }
    }

    for (const [group, directory] of Object.entries(LWC_GROUPS)) {
        const entries = await readdir(path.join(root, directory), { withFileTypes: true });
        const bundles = entries.filter((e) => e.isDirectory()).map((e) => e.name);
        for (const name of bundles.sort()) {
            const result = await LwcParser.parseLwcBundle(path.join(root, directory, name));
            await write(path.join(outputDirectory, 'lwc', group, `${name}.json`), result);
            rows.push({
                group: `lwc/${group}`,
                name,
                dataType: result.dataType,
                nodes: countNodes(result.result.base),
                errors: result.resolvedError.length,
            });
        }
    }

    await writeFile(
        path.join(outputDirectory, 'index.md'),
        [
            '# サンプルコードの JSON',
            '',
            '`npx ttsx --noCheck docs/examples/json-samples/generate.ts` で生成。',
            'ノード数は kind を持つ JSON ノード (JsonType / StructureJsonType / ErrorJson) の数。',
            '',
            '| グループ | サンプル | dataType | ノード数 | resolvedError |',
            '| --- | --- | --- | ---: | ---: |',
            ...rows.map(
                (r) =>
                    `| ${r.group} | [${r.name}](${r.group}/${r.name}.json) | ${r.dataType} | ${r.nodes} | ${r.errors} |`,
            ),
            '',
        ].join('\n'),
    );
    rows.forEach((r) => console.log(`${r.group.padEnd(22)} ${r.name.padEnd(36)} ${r.dataType}`));
};

await main();
