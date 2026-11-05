/**
 * Diff の動作検証。before/ と after/ を本番と同じ流れ (ApexParser.parseApexUnits) で単位 (クラス・トリガー・匿名 Apex。
 * クラス・トリガーはソースと -meta.xml を 1 つにまとめる) ごとに変換し、makeApexUnitDiffs で比べた結果を output/diff/ に出力する。
 *
 * - output/diff/unit-diff.json: makeApexUnitDiffs の結果
 * - output/diff/summary.md:     unchanged 以外の差分を、ソースの文字列付きで木の形に並べたもの
 * - output/diff/coverage.md:    JsonType / StructureJsonType の kind ごとの、JSON・差分への出現数
 *
 * 実行: npx ttsx --noCheck docs/examples/apex/scripts/run-diff.ts (samples/diff/before → after、出力は output/diff/)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ApexParser } from '../../../../src/analyzer/parser/Apex/parser';
import { makeApexUnitDiffs } from '../../../../src/analyzer/processor/Apex/diff/unit';

type SourceJson = {
    objectKey: string;
    context: string;
    source: { sourceKey: string; start: { line: number } }[];
};
type Keys = { objectKey: string; sourceKey: string };

const here = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.resolve(here, '../output/diff');
const samples = path.resolve(here, '../samples/diff');

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
    'メタデータ (-meta.xml)': ['apexClassMeta', 'apexTriggerMeta'],
    エラー: ['error'],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isKeys = (value: unknown): value is Keys =>
    isRecord(value) && typeof value.objectKey === 'string' && typeof value.sourceKey === 'string';

/** before / after の全単位を変換する。filePath は実行環境に依らないようファイル名にする (対応付けは id) */
export const parseDirectory = async (directory: string) =>
    (await ApexParser.parseApexUnits(directory)).map((unit) => ({
        ...unit,
        filePath: path.basename(unit.filePath),
    }));

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

const isPairRecord = (value: unknown): value is { before?: unknown; after?: unknown } =>
    isRecord(value) &&
    Object.keys(value).length > 0 &&
    Object.keys(value).every((key) => key === 'before' || key === 'after');

/**
 * 差分の sourceKeys (objectKey / sourceKey ごとに「同じなら単体、違えば { before, after }」) から、
 * 片側の sourceKeys を取り出す
 */
const pickSide = (value: unknown, side: 'before' | 'after'): unknown => {
    if (isPairRecord(value)) {
        return value[side];
    }
    if (Array.isArray(value)) {
        return value.map((v) => pickSide(v, side));
    }
    if (isRecord(value)) {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, pickSide(v, side)]));
    }
    return value;
};

const short = (value: unknown) => {
    const text = JSON.stringify(value) ?? 'undefined';
    return text.length > 70 ? `${text.slice(0, 70)}…` : text;
};

const DIFF_STATUSES = new Set(['unchanged', 'changed', 'added', 'removed', 'moved']);

/** 差分の値として扱い、中に入らないプロパティ */
const LEAF_KEYS = new Set([
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

        // status が差分の語彙のときだけ差分のノード (-meta.xml の <status> のような、中身の status と区別する)
        const isDiffNode = typeof node.status === 'string' && DIFF_STATUSES.has(node.status);
        let nextDepth = depth;
        if (isDiffNode && node.status !== 'unchanged') {
            const kind = isRecord(node.kind)
                ? `${String(node.kind.before ?? '-')} → ${String(node.kind.after ?? '-')}`
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
                node.status === 'removed'
                    ? { before: node.sourceKeys }
                    : node.status === 'added'
                      ? { after: node.sourceKeys }
                      : {
                            before: pickSide(node.sourceKeys, 'before'),
                            after: pickSide(node.sourceKeys, 'after'),
                        };
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
            // 差分のノードの value は元の JSON (中身) なので入らない。status は値の差分 (fields.status) のときだけ入る
            if (isDiffNode && k === 'value') return;
            if (k === 'status' && isRecord(v)) {
                walk(v, k, nextDepth);
            } else if (!LEAF_KEYS.has(k) && !(k === 'value' && !isRecord(v) && !Array.isArray(v))) {
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
    const before = await parseDirectory(path.join(samples, 'before'));
    const after = await parseDirectory(path.join(samples, 'after'));
    const diffs = makeApexUnitDiffs(before, after);
    return { before, after, diffs };
};

const main = async () => {
    const { before, after, diffs } = await runDiff();
    await mkdir(outputDirectory, { recursive: true });

    await writeFile(
        path.join(outputDirectory, 'unit-diff.json'),
        `${JSON.stringify(diffs, null, 2)}\n`,
        'utf8',
    );

    // summary
    const summary = [
        '# Diff の結果',
        '',
        '`run-diff.ts` が出力する。unchanged 以外の差分だけを並べる。',
        '',
    ];
    const sourcesOf = (units: typeof before, id: string) =>
        (units.find((unit) => unit.result.id === id)?.result.sourceObject ?? []) as SourceJson[];
    diffs.forEach((diff) => {
        summary.push(`## ${diff.id}`, '');
        summary.push(`- 単位: **${diff.status}**（filePath: ${JSON.stringify(diff.filePath)}）`);
        if (diff.status === 'added' || diff.status === 'removed') {
            summary.push('');
            return;
        }
        const solved = diff.resolvedError.filter((e) => e.status === 'removed').length;
        const raised = diff.resolvedError.filter((e) => e.status === 'added').length;
        if (solved || raised) {
            summary.push(`- 構文エラー: 解消 ${solved} 件 / 発生 ${raised} 件`);
        }
        const lookup = {
            before: makeSourceLookup(sourcesOf(before, diff.id)),
            after: makeSourceLookup(sourcesOf(after, diff.id)),
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

    diffs.forEach((d) => console.log(`${d.status.padEnd(9)} ${d.id}`));
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
