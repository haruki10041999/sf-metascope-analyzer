/**
 * Diff の動作検証。before/ と after/ の同じ名前のファイルを本番と同じ流れ (ApexParser.parseApexClass) で変換し、
 * makeUnitDiffs で比べた結果を diff-output/ に出力する。
 *
 * - diff-output/unit-diff.json: makeUnitDiffs の結果 (target は大きいので除く)
 * - diff-output/summary.md:     unchanged 以外の差分を、ソースの文字列付きで木の形に並べたもの
 * - diff-output/coverage.md:    JsonType / StructureJsonType の kind ごとの、JSON・差分への出現数
 *
 * 実行: npx ttsx --noCheck docs/examples/apex-diff/run-diff.ts
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ApexParser } from '../../../src/analyzer/parser/Apex/parser';
import { makeUnitDiffs } from '../../../src/analyzer/processor/Apex/diff/unit';

type SourceJson = {
    objectKey: string;
    context: string;
    source: { sourceKey: string; start: { line: number } }[];
};
type Keys = { objectKey: string; sourceKey: string };

const here = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.join(here, 'diff-output');

/** JsonType / StructureJsonType の kind の一覧 (docs/apex-json-reference.md) */
export const ALL_KINDS = {
    宣言: [
        'class',
        'interface',
        'interfaceMethod',
        'method',
        'constructor',
        'property',
        'field',
        'enum',
        'enumConstant',
        'notSet',
    ],
    ユニット: ['triggerCase'],
    '修飾子・パラメータ・型': ['modifier', 'annotation', 'parameter', 'type'],
    式: ['memberAccess'],
    文: [
        'break',
        'continue',
        'delete',
        'doWhile',
        'expression',
        'for',
        'if',
        'insert',
        'localVariable',
        'merge',
        'return',
        'runAs',
        'switch',
        'throw',
        'try',
        'undelete',
        'update',
        'upsert',
        'while',
    ],
    文の補助ノード: [
        'doWhileCondition',
        'forCondition',
        'ifCondition',
        'runAsCondition',
        'switchVariant',
        'switchCondition',
        'catchCondition',
        'whileCondition',
    ],
    SOQL: [
        'soql',
        'subQuery',
        'selectEntry',
        'fromField',
        'singleCondition',
        'groupBy',
        'orderField',
        'limitClause',
        'offsetClause',
        'forClause',
        'updateClause',
        'allRowsClause',
        'usingScopeClause',
        'categoryCondition',
    ],
    SOSL: ['sosl', 'soslField'],
    エラー: ['error'],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isKeys = (value: unknown): value is Keys =>
    isRecord(value) && typeof value.objectKey === 'string' && typeof value.sourceKey === 'string';

/** before / after の全ファイルを変換する。filePath はディレクトリをまたいで対応付けるためファイル名にする */
export const parseDirectory = async (directory: string) => {
    const files = (await readdir(directory)).sort();
    return Promise.all(
        files.map(async (file) => ({
            ...(await ApexParser.parseApexClass(path.join(directory, file))),
            filePath: file,
        })),
    );
};

// ---------------------------------------------------------------------------
// summary
// ---------------------------------------------------------------------------

/** sourceKeys からソースの文字列と行を引く */
const makeSourceLookup = (sources: SourceJson[]) => (keys: unknown) => {
    const target = isKeys(keys)
        ? keys
        : isRecord(keys) && isKeys(keys.base)
          ? keys.base
          : undefined;
    if (!target) {
        return undefined;
    }
    const sourceJson = sources.find((s) => s.objectKey === target.objectKey);
    const span = sourceJson?.source.find((s) => s.sourceKey === target.sourceKey);
    if (!sourceJson || !span) {
        return undefined;
    }
    const text = sourceJson.context.replace(/\s+/g, ' ').trim();
    return `L${span.start.line} \`${text.length > 70 ? `${text.slice(0, 70)}…` : text}\``;
};

/** sourceKeys を持たない値 (仮想ノード) は、中で最初に見つかる sourceKeys の文字列を使う */
const findNestedText = (
    value: unknown,
    lookup: ReturnType<typeof makeSourceLookup>,
): string | undefined => {
    if (Array.isArray(value)) {
        return value.map((v) => findNestedText(v, lookup)).find((t) => t !== undefined);
    }
    if (!isRecord(value)) {
        return undefined;
    }
    return (
        lookup(value.sourceKeys) ??
        Object.values(value)
            .map((v) => findNestedText(v, lookup))
            .find((t) => t !== undefined)
    );
};

const short = (value: unknown) => {
    const text = JSON.stringify(value) ?? 'undefined';
    return text.length > 70 ? `${text.slice(0, 70)}…` : text;
};

/** 差分の値として扱い、中に入らないプロパティ */
const LEAF_KEYS = new Set([
    'value',
    'before',
    'after',
    'sourceKeys',
    'index',
    'from',
    'moved',
    'kind',
    'label',
    'role',
    'status',
    'match',
    'target',
    'resolvedError',
    'filePath',
    'dataType',
    'modifierType',
    'name',
]);

const renderDiff = (
    diff: unknown,
    lookup: {
        before: ReturnType<typeof makeSourceLookup>;
        after: ReturnType<typeof makeSourceLookup>;
    },
) => {
    const lines: string[] = [];

    const walk = (node: unknown, key: string, depth: number) => {
        if (Array.isArray(node)) {
            node.forEach((n) => walk(n, key, depth));
            return;
        }
        if (!isRecord(node)) {
            return;
        }

        let nextDepth = depth;
        if (typeof node.status === 'string' && node.status !== 'unchanged') {
            const kind = isRecord(node.kind)
                ? `${String(node.kind.before)} → ${String(node.kind.after)}`
                : (node.kind ?? node.label ?? node.key ?? key);
            const name =
                typeof node.name === 'string'
                    ? ` ${node.name}`
                    : isRecord(node.value) && typeof node.value.name === 'string'
                      ? ` ${node.value.name}`
                      : '';
            let line = `${'  '.repeat(depth)}- **${node.status}** ${String(kind)}${name}`;
            if (typeof node.match === 'string') {
                line += ` (${node.match})`;
            }

            const keys =
                isRecord(node.sourceKeys) &&
                ('before' in node.sourceKeys || 'after' in node.sourceKeys)
                    ? node.sourceKeys
                    : node.status === 'removed'
                      ? { before: node.sourceKeys }
                      : { after: node.sourceKeys };
            const beforeText = lookup.before(keys.before);
            const afterText = lookup.after(keys.after);

            if (
                node.status === 'changed' &&
                'before' in node &&
                'after' in node &&
                !('fields' in node)
            ) {
                line += `: ${short(node.before)} → ${short(node.after)}`;
            } else if (node.status === 'added' || node.status === 'removed') {
                const find = node.status === 'added' ? lookup.after : lookup.before;
                line += `: ${(node.status === 'added' ? afterText : beforeText) ?? findNestedText(node.value, find) ?? short(node.value)}`;
            } else if (afterText || beforeText) {
                line += `: ${beforeText ?? '-'} → ${afterText ?? '-'}`;
            }
            const from = (node.from ?? node.moved) as { parent: string; index: number } | undefined;
            if (from) {
                line += ` ⟵ 移動元 ${from.parent}[${from.index}]`;
            }
            lines.push(line);
            nextDepth = depth + 1;
        }

        Object.entries(node).forEach(([k, v]) => {
            if (!LEAF_KEYS.has(k)) {
                walk(v, k, nextDepth);
            }
        });
    };

    walk(diff, '', 0);
    return lines;
};

// ---------------------------------------------------------------------------
// coverage
// ---------------------------------------------------------------------------

/** JSON の中の JsonType / StructureJsonType の kind を数える */
const countJsonKinds = (json: unknown, counts: Map<string, number>) => {
    if (Array.isArray(json)) {
        json.forEach((j) => countJsonKinds(j, counts));
        return;
    }
    if (!isRecord(json)) {
        return;
    }
    if (typeof json.kind === 'string' && isRecord(json.sourceKeys)) {
        counts.set(json.kind, (counts.get(json.kind) ?? 0) + 1);
    }
    Object.values(json).forEach((v) => countJsonKinds(v, counts));
};

/** 差分のノード (status を持つもの) として現れた kind を数える。GumTree のラベルは kind に戻す */
export const countDiffKinds = (diff: unknown, counts: Map<string, number>) => {
    if (Array.isArray(diff)) {
        diff.forEach((d) => countDiffKinds(d, counts));
        return;
    }
    if (!isRecord(diff)) {
        return;
    }
    if (typeof diff.status === 'string') {
        const kinds = [
            // 名前で対応付いて引数だけが変わった修飾子はアノテーション
            diff.kind === 'modifier' && diff.status === 'changed' ? 'annotation' : undefined,
            diff.kind,
            typeof diff.label === 'string' ? diff.label.split(':')[0] : undefined,
            isRecord(diff.value) ? diff.value.kind : undefined,
            isRecord(diff.kind) ? diff.kind.before : undefined,
            isRecord(diff.kind) ? diff.kind.after : undefined,
        ];
        new Set(kinds.filter((k): k is string => typeof k === 'string')).forEach((k) =>
            counts.set(k, (counts.get(k) ?? 0) + 1),
        );
    }
    Object.entries(diff).forEach(([k, v]) => {
        if (k !== 'target') {
            countDiffKinds(v, counts);
        }
    });
};

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

export const runDiff = async () => {
    const before = await parseDirectory(path.join(here, 'before'));
    const after = await parseDirectory(path.join(here, 'after'));
    const diffs = makeUnitDiffs(before, after);
    return { before, after, diffs };
};

const main = async () => {
    const { before, after, diffs } = await runDiff();
    await mkdir(outputDirectory, { recursive: true });

    const withoutTarget = diffs.map(({ target: _target, ...rest }) => rest);
    await writeFile(
        path.join(outputDirectory, 'unit-diff.json'),
        `${JSON.stringify(withoutTarget, null, 2)}\n`,
        'utf8',
    );

    // summary
    const summary = [
        '# Diff の結果',
        '',
        '`run-diff.ts` が出力する。unchanged 以外の差分だけを並べる。',
        '',
    ];
    diffs.forEach((diff) => {
        summary.push(`## ${diff.filePath}`, '');
        summary.push(
            `- ファイル: **${diff.status}**（dataType: ${JSON.stringify(diff.dataType)}）`,
        );
        if (diff.status === 'added' || diff.status === 'removed') {
            summary.push('');
            return;
        }
        const resolvedError = diff.resolvedError;
        if (!Array.isArray(resolvedError)) {
            summary.push(
                `- 構文エラー: 解消 ${resolvedError.before.length} 件 / 発生 ${resolvedError.after.length} 件`,
            );
        }
        const sourceOf = (result: unknown) =>
            (isRecord(result) && Array.isArray(result.sourceObject)
                ? result.sourceObject
                : []) as SourceJson[];
        const target = diff.target as { before: unknown; after: unknown };
        const lookup = {
            before: makeSourceLookup(sourceOf(target.before)),
            after: makeSourceLookup(sourceOf(target.after)),
        };
        const lines = 'content' in diff && diff.content ? renderDiff(diff.content, lookup) : [];
        summary.push('', ...(lines.length ? lines : ['（中身の差分なし）']), '');
    });
    await writeFile(path.join(outputDirectory, 'summary.md'), `${summary.join('\n')}\n`, 'utf8');

    // coverage
    const jsonKinds = new Map<string, number>();
    [...before, ...after].forEach((file) => countJsonKinds(file.result.base, jsonKinds));
    const diffKinds = new Map<string, number>();
    countDiffKinds(diffs, diffKinds);

    const coverage = [
        '# kind ごとの出現数',
        '',
        '`run-diff.ts` が出力する。「差分」は status を持つ差分のノードとして現れた数（unchanged の子も含む）。',
        '',
        '| 分類 | kind | JSON | 差分 |',
        '| --- | --- | --- | --- |',
    ];
    const missing: string[] = [];
    Object.entries(ALL_KINDS).forEach(([group, kinds]) =>
        kinds.forEach((kind) => {
            const inJson = jsonKinds.get(kind) ?? 0;
            const inDiff = diffKinds.get(kind) ?? 0;
            if (inDiff === 0) {
                missing.push(kind);
            }
            coverage.push(`| ${group} | \`${kind}\` | ${inJson} | ${inDiff} |`);
        }),
    );
    coverage.push(
        '',
        missing.length
            ? `差分に現れない kind: ${missing.map((k) => `\`${k}\``).join(', ')}`
            : 'すべての kind が差分に現れた。',
    );
    await writeFile(path.join(outputDirectory, 'coverage.md'), `${coverage.join('\n')}\n`, 'utf8');

    diffs.forEach((d) => console.log(`${d.status.padEnd(9)} ${d.filePath}`));
    console.log(
        missing.length
            ? `差分に現れない kind: ${missing.join(', ')}`
            : 'すべての kind が差分に現れた',
    );
    console.log(`出力: ${outputDirectory}`);
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    await main();
}
