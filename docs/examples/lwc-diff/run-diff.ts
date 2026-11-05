/**
 * LWC の Diff の動作検証。before/ と after/ のバンドル (同じフォルダ名同士) を本番と同じ流れ
 * (LwcParser.parseLwcBundle) で JSON にし、makeLwcBundleDiffs で比べた結果を diff-output/ に出力する。
 *
 * - diff-output/bundle-diff.json: makeLwcBundleDiffs の結果
 * - diff-output/summary.md:       unchanged 以外の差分を、JSON のパス付きで並べたもの
 *
 * 実行: npx ttsx --noCheck docs/examples/lwc-diff/run-diff.ts
 * 方針: docs/lwc-diff-policy.md
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LwcParser } from '../../../src/analyzer/parser/Lwc/parser';
import { makeLwcBundleDiffs } from '../../../src/analyzer/processor/Lwc/diff/bundle';

const here = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.join(here, 'diff-output');

/** フォルダの中のバンドル (サブフォルダ) をすべて読む */
export const parseBundles = async (directory: string) => {
    const entries = await readdir(directory, { withFileTypes: true });
    const bundles = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort();
    return Promise.all(
        bundles.map(async (name) => {
            const result = await LwcParser.parseLwcBundle(path.join(directory, name));
            // 出力をマシンに依存させないため、フォルダのパスを相対にする
            return {
                ...result,
                filePath: path.relative(here, result.filePath).replace(/\\/g, '/'),
            };
        }),
    );
};

// ---------------------------------------------------------------------------
// summary
// ---------------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const short = (value: unknown) => {
    const text = JSON.stringify(value, (key, v) => (key === 'sourceKeys' ? undefined : v));
    return text === undefined ? 'undefined' : text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

/** unchanged 以外の差分を、パス付きで 1 行ずつ並べる (中を比べたもの は fields の中をたどる) */
const collect = (diff: unknown, at: string, lines: string[]) => {
    if (Array.isArray(diff)) {
        diff.forEach((item, index) => {
            const name = isRecord(item) ? itemName(item) : undefined;
            collect(item, `${at}[${name ?? index}]`, lines);
        });
        return;
    }
    if (!isRecord(diff)) return;
    const status = typeof diff.status === 'string' ? diff.status : undefined;
    if (status === 'unchanged') return;
    const kind = typeof diff.kind === 'string' ? ` (${diff.kind})` : '';
    const match = typeof diff.match === 'string' ? ` match=${diff.match}` : '';

    if (status && 'fields' in diff) {
        lines.push(`- \`${at}\`${kind}: **${status}**${match}`);
        collect(diff.fields, at, lines);
        return;
    }
    if (status === 'added' || status === 'removed' || status === 'moved') {
        lines.push(`- \`${at}\`${kind}: **${status}**${match} ${short(diff.value)}`);
        return;
    }
    if (status === 'changed' && 'before' in diff) {
        lines.push(
            `- \`${at}\`${kind}: **changed**${match} ${short(diff.before)} → ${short(diff.after)}`,
        );
        return;
    }
    Object.entries(diff).forEach(([key, value]) => {
        if (key !== 'sourceKeys' && key !== 'index') collect(value, `${at}.${key}`, lines);
    });
};

/** 配列の要素の表示名 (名前・ファイル名・キーのどれか) */
const itemName = (item: Record<string, unknown>): string | undefined => {
    const value = isRecord(item.value) ? item.value : isRecord(item.fields) ? item.fields : item;
    for (const key of ['fileName', 'name', 'local', 'key', 'source']) {
        const v = value[key];
        if (typeof v === 'string') return v;
        if (isRecord(v) && typeof v.value === 'string') return v.value;
        if (isRecord(v) && typeof v.after === 'string') return v.after;
    }
    return undefined;
};

/** before/ と after/ を読んで比べる (テストからも使う) */
export const runDiff = async () => {
    const before = await parseBundles(path.join(here, 'before'));
    const after = await parseBundles(path.join(here, 'after'));
    return { before, after, diffs: makeLwcBundleDiffs(before, after) };
};

const main = async () => {
    const { diffs } = await runDiff();

    await mkdir(outputDirectory, { recursive: true });
    await writeFile(
        path.join(outputDirectory, 'bundle-diff.json'),
        `${JSON.stringify(diffs, null, 2)}\n`,
    );

    const sections = diffs.map((diff) => {
        const lines: string[] = [];
        collect({ resolvedError: diff.resolvedError, content: diff.content }, diff.id, lines);
        return [
            `## ${diff.id} (${diff.status})`,
            '',
            `- dataType: \`${short(diff.dataType)}\``,
            ...lines,
            '',
        ].join('\n');
    });
    await writeFile(
        path.join(outputDirectory, 'summary.md'),
        [
            '# LWC Diff の結果 (before → after)',
            '',
            '`npx ttsx --noCheck docs/examples/lwc-diff/run-diff.ts` で生成。unchanged 以外の差分だけを並べる。',
            '',
            ...sections,
        ].join('\n'),
    );
    console.log(diffs.map((d) => `${d.id}: ${d.status}`).join('\n'));
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    await main();
}
