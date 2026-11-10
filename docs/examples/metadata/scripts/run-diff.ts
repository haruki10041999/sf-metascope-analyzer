/**
 * オブジェクトの Diff の動作検証。repository/before と after のオブジェクトを本番と同じ流れ (MetadataParser.parseObjects) で読み、
 * makeObjectUnitDiffs で比べた結果を output/diff/ に出力する。
 *
 * - output/diff/object-diff.json: makeObjectUnitDiffs の結果
 * - output/diff/summary.md:       unchanged 以外の差分を、ファイルと行付きで木の形に並べたもの
 * - output/diff/coverage.md:      kind ごとの、JSON・差分への出現数
 * - output/diff/report-data.json: viewer (MCP の analyze_objects、isDiff: true) に渡す表示用のデータ
 * - output/diff/translation-diff.json: makeObjectTranslationUnitDiffs の結果 (オブジェクトの翻訳)
 * - output/diff/translation-coverage.md: 翻訳の網羅 (after の翻訳とオブジェクトの突き合わせ。before と比べた古い翻訳も含む)
 *
 * 実行: npx ttsx --noCheck docs/examples/metadata/scripts/run-diff.ts
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ObjectParseResult } from '../../../../src/analyzer/parser/Metadata/parser';
import {
    analyzeObject,
    getObjectDependencies,
} from '../../../../src/analyzer/processor/Metadata/analysis';
import {
    makeObjectTranslationUnitDiffs,
    makeObjectUnitDiffs,
} from '../../../../src/analyzer/processor/Metadata/diff/unit';
import { analyzeTranslationCoverages } from '../../../../src/analyzer/processor/Metadata/translation';
import { ObjectTranslationParseResult } from '../../../../src/analyzer/parser/Metadata/objectTranslation';
import {
    makeDependencyDiffViews,
    makeObjectDiffViews,
} from '../../../../src/analyzer/processor/Metadata/view';
import { XmlSourceJson } from '../../../../src/analyzer/types/commons/xmlJson';
import { parseSide, parseTranslationSide } from './run-parse';

const here = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.resolve(here, '../output/diff');

/** JsonType の kind の一覧 (docs/metadata-implementation.md) */
export const ALL_KINDS = [
    'object',
    'field',
    'picklistValue',
    'validationRule',
    'recordType',
    'recordTypePicklist',
    'listView',
    'fieldSet',
    'compactLayout',
    'webLink',
    'businessProcess',
    'sharingReason',
    'objectActionOverride',
    // オブジェクトの翻訳
    'objectTranslation',
    'fieldTranslation',
    'picklistValueTranslation',
    'recordTypeTranslation',
    'validationRuleTranslation',
    'webLinkTranslation',
    'fieldSetTranslation',
    'layoutTranslation',
    // 読めなかったファイルは JSON に持たない (エラーのノードはない。理由は resolvedError)
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const runDiff = async () => {
    const before = await parseSide('before');
    const after = await parseSide('after');
    const diffs = makeObjectUnitDiffs(before, after);
    const infos = (results: ObjectParseResult[]) =>
        results.flatMap((r) => (r.dataType === 'object' ? [analyzeObject(r.result.base)] : []));
    const views = {
        metadata: makeObjectDiffViews(infos(before), infos(after), diffs),
        dependency: makeDependencyDiffViews(
            getObjectDependencies(infos(before)),
            getObjectDependencies(infos(after)),
        ),
    };
    const beforeTranslations = await parseTranslationSide('before');
    const afterTranslations = await parseTranslationSide('after');
    const translationDiffs = makeObjectTranslationUnitDiffs(beforeTranslations, afterTranslations);
    const objects = (results: ObjectParseResult[]) =>
        results.flatMap((r) => (r.dataType === 'object' ? [r.result.base] : []));
    const translations = (results: ObjectTranslationParseResult[]) =>
        results.flatMap((r) => (r.dataType === 'objectTranslation' ? [r.result.base] : []));
    const coverages = analyzeTranslationCoverages(translations(afterTranslations), objects(after), {
        translations: translations(beforeTranslations),
        objects: objects(before),
    });
    return {
        before,
        after,
        diffs,
        views,
        beforeTranslations,
        afterTranslations,
        translationDiffs,
        coverages,
    };
};

// ---------------------------------------------------------------------------
// summary
// ---------------------------------------------------------------------------

/** sourceKeys (片側、または objectKey / sourceKey ごとの { before, after }) から、片側のキーを取り出す */
const pickSide = (value: unknown, side: 'before' | 'after'): unknown => {
    if (isRecord(value) && Object.keys(value).every((key) => key === 'before' || key === 'after')) {
        return value[side];
    }
    if (isRecord(value)) {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, pickSide(v, side)]));
    }
    return value;
};

const makeLookup = (sources: XmlSourceJson[]) => (keys: unknown) => {
    if (!isRecord(keys) || typeof keys.objectKey !== 'string') return undefined;
    const object = sources.find((s) => s.objectKey === keys.objectKey);
    const source = object?.source.find((s) => s.sourceKey === keys.sourceKey);
    return source ? `${source.filePath} L${source.start.line}` : undefined;
};

const short = (value: unknown) => {
    const text = JSON.stringify(value) ?? 'undefined';
    return text.length > 80 ? `${text.slice(0, 80)}…` : text;
};

/** 差分の値として扱い、中に入らないプロパティ */
const LEAF_KEYS = new Set([
    'before',
    'after',
    'sourceKeys',
    'index',
    'kind',
    'status',
    'match',
    'value',
]);

const renderDiff = (
    diff: unknown,
    lookup: { before: ReturnType<typeof makeLookup>; after: ReturnType<typeof makeLookup> },
) => {
    const lines: string[] = [];
    const walk = (node: unknown, key: string, depth: number) => {
        if (Array.isArray(node)) {
            node.forEach((n) => walk(n, key, depth));
            return;
        }
        if (!isRecord(node)) return;

        let nextDepth = depth;
        if (typeof node.status === 'string' && node.status !== 'unchanged') {
            const kind = isRecord(node.kind)
                ? `${String(node.kind.before ?? '-')} → ${String(node.kind.after ?? '-')}`
                : (node.kind ?? key);
            // 名前は、added / removed / moved なら value、changed なら fields の値から取る
            const value = isRecord(node.value) ? node.value : {};
            const fields = isRecord(node.fields) ? node.fields : {};
            const fieldValue = (key: string) =>
                isRecord(fields[key]) ? (fields[key] as Record<string, unknown>).value : undefined;
            const name =
                value.apiName ??
                value.fullName ??
                value.picklist ??
                value.name ??
                value.masterLabel ??
                value.layout ??
                fieldValue('apiName') ??
                fieldValue('fullName') ??
                fieldValue('picklist') ??
                fieldValue('name') ??
                fieldValue('masterLabel') ??
                '';
            let line = `${'  '.repeat(depth)}- **${node.status}** ${String(kind)}${name ? ` ${String(name)}` : ''}`;
            if (typeof node.match === 'string') line += ` (${node.match})`;

            const keys =
                node.status === 'removed'
                    ? { before: node.sourceKeys }
                    : node.status === 'added'
                      ? { after: node.sourceKeys }
                      : {
                            before: pickSide(node.sourceKeys, 'before'),
                            after: pickSide(node.sourceKeys, 'after'),
                        };
            const where = lookup.after(keys.after) ?? lookup.before(keys.before);
            if (
                node.status === 'changed' &&
                'before' in node &&
                'after' in node &&
                !('fields' in node)
            ) {
                line += `: ${short(node.before)} → ${short(node.after)}`;
            } else if (node.status === 'moved' && !isRecord(node.value)) {
                line += `: ${short(node.value)} (${String((node.index as { before: number }).before)} → ${String((node.index as { after: number }).after)})`;
            } else if (
                (node.status === 'added' || node.status === 'removed') &&
                Array.isArray(node.value)
            ) {
                // 子の配列ごとの added / removed: 要素を 1 行ずつ並べる
                const side = node.status === 'added' ? lookup.after : lookup.before;
                lines.push(line);
                node.value.forEach((item) => {
                    const element = isRecord(item) ? item : {};
                    const content = isRecord(element.value) ? element.value : {};
                    const label =
                        content.apiName ?? content.fullName ?? content.name ?? short(content);
                    const at = side(element.sourceKeys);
                    lines.push(
                        `${'  '.repeat(depth + 1)}- ${String(element.kind ?? key)} ${String(label)}${at ? ` — ${at}` : ''}`,
                    );
                });
                return;
            } else if ((node.status === 'added' || node.status === 'removed') && !where) {
                line += `: ${short(node.value)}`;
            }
            if (where) line += ` — ${where}`;
            lines.push(line);
            nextDepth = depth + 1;
        }
        Object.entries(node).forEach(([k, v]) => {
            if (!LEAF_KEYS.has(k)) walk(v, k, nextDepth);
        });
    };
    walk(diff, '', 0);
    return lines;
};

// ---------------------------------------------------------------------------
// coverage
// ---------------------------------------------------------------------------

const countJsonKinds = (json: unknown, counts: Map<string, number>) => {
    if (Array.isArray(json)) {
        json.forEach((j) => countJsonKinds(j, counts));
        return;
    }
    if (!isRecord(json)) return;
    if (typeof json.kind === 'string' && isRecord(json.sourceKeys)) {
        counts.set(json.kind, (counts.get(json.kind) ?? 0) + 1);
    }
    Object.values(json).forEach((v) => countJsonKinds(v, counts));
};

/** 差分のノード (status を持つもの) として現れた kind を数える */
export const countDiffKinds = (diff: unknown, counts: Map<string, number>) => {
    if (Array.isArray(diff)) {
        diff.forEach((d) => countDiffKinds(d, counts));
        return;
    }
    if (!isRecord(diff)) return;
    if (typeof diff.status === 'string') {
        const kinds = isRecord(diff.kind) ? [diff.kind.before, diff.kind.after] : [diff.kind];
        new Set(kinds.filter((k): k is string => typeof k === 'string')).forEach((k) =>
            counts.set(k, (counts.get(k) ?? 0) + 1),
        );
    }
    Object.values(diff).forEach((v) => countDiffKinds(v, counts));
};

const main = async () => {
    const {
        before,
        after,
        diffs,
        views,
        beforeTranslations,
        afterTranslations,
        translationDiffs,
        coverages,
    } = await runDiff();
    await mkdir(outputDirectory, { recursive: true });
    const write = (name: string, text: string) =>
        writeFile(path.join(outputDirectory, name), text, 'utf8');

    await write('object-diff.json', `${JSON.stringify(diffs, null, 2)}\n`);
    await write('report-data.json', `${JSON.stringify(views, null, 2)}\n`);
    await write('translation-diff.json', `${JSON.stringify(translationDiffs, null, 2)}\n`);

    const sourcesOf = (results: (ObjectParseResult | ObjectTranslationParseResult)[], id: string) =>
        results.find((r) => r.result.id === id)?.result.sourceObject ?? [];
    const summary = [
        '# オブジェクトの Diff の結果',
        '',
        '`run-diff.ts` が出力する。unchanged 以外の差分だけを並べる。',
        '',
    ];
    const units = [
        ...diffs.map((diff) => ({ diff, label: 'オブジェクト', before, after })),
        ...translationDiffs.map((diff) => ({
            diff,
            label: '翻訳',
            before: beforeTranslations,
            after: afterTranslations,
        })),
    ];
    units.forEach(({ diff, label, before, after }, index) => {
        if (index === diffs.length) {
            summary.push('# オブジェクトの翻訳', '');
        }
        summary.push(
            `## ${diff.id}`,
            '',
            `- ${label}: **${diff.status}**（dataType: ${JSON.stringify(diff.dataType)}）`,
        );
        const errors = diff.resolvedError.filter((e) => e.status !== 'unchanged');
        errors.forEach((e) => {
            const error = e.value as {
                filePath: string;
                start: { line: number };
                errorMessage: string;
            };
            summary.push(
                `- 読めなかったファイル **${e.status}**: ${error.filePath} L${error.start.line} ${error.errorMessage}`,
            );
        });
        if (diff.content) {
            const lookup = {
                before: makeLookup(sourcesOf(before, diff.id)),
                after: makeLookup(sourcesOf(after, diff.id)),
            };
            const lines = renderDiff(diff.content, lookup);
            summary.push('', ...(lines.length ? lines : ['（中身の差分なし）']));
        }
        summary.push('');
    });
    await write('summary.md', `${summary.join('\n')}\n`);

    const jsonKinds = new Map<string, number>();
    [...before, ...after, ...beforeTranslations, ...afterTranslations].forEach((result) =>
        countJsonKinds(result.result.base, jsonKinds),
    );
    const diffKinds = new Map<string, number>();
    countDiffKinds([...diffs, ...translationDiffs], diffKinds);
    const missing = ALL_KINDS.filter((kind) => !diffKinds.has(kind));
    const coverage = [
        '# kind ごとの出現数',
        '',
        '`run-diff.ts` が出力する。「差分」は status を持つ差分のノードとして現れた数（unchanged の子も含む）。',
        '',
        '| kind | JSON | 差分 |',
        '| --- | --- | --- |',
        ...ALL_KINDS.map(
            (kind) => `| \`${kind}\` | ${jsonKinds.get(kind) ?? 0} | ${diffKinds.get(kind) ?? 0} |`,
        ),
        '',
        missing.length
            ? `差分に現れない kind: ${missing.map((k) => `\`${k}\``).join(', ')}`
            : 'すべての kind が差分に現れた。',
    ];
    await write('coverage.md', `${coverage.join('\n')}\n`);

    const statusLabel = {
        translated: '翻訳あり',
        missing: '未翻訳',
        sameAsSource: '翻訳元と同じ',
        orphan: '宙に浮いた翻訳',
        outdated: '古い翻訳',
    };
    const translationCoverage = [
        '# 翻訳の網羅',
        '',
        '`run-diff.ts` が出力する。after の翻訳を同じ時点のオブジェクトと突き合わせ、before と比べて古い翻訳も見る（`analyzeTranslationCoverages`）。翻訳ありのものは件数だけを書き、それ以外を一覧にする。',
        '',
        `| 翻訳 | ${Object.values(statusLabel).join(' | ')} |`,
        `| --- | ${Object.values(statusLabel)
            .map(() => '---')
            .join(' | ')} |`,
        ...coverages.map(
            (c) =>
                `| ${c.id} | ${(Object.keys(statusLabel) as (keyof typeof statusLabel)[])
                    .map((status) => c.counts[status])
                    .join(' | ')} |`,
        ),
        '',
        ...coverages.flatMap((c) => {
            const items = c.items.filter((item) => item.status !== 'translated');
            return [
                `## ${c.id}`,
                '',
                ...(items.length
                    ? items.map(
                          (item) =>
                              `- **${statusLabel[item.status]}** ${item.kind} \`${item.name}\`: ${item.source ?? '-'} → ${item.translation ?? '-'}`,
                      )
                    : ['（指摘なし）']),
                '',
            ];
        }),
    ];
    await write('translation-coverage.md', `${translationCoverage.join('\n')}\n`);

    [...diffs, ...translationDiffs].forEach((d) => console.log(`${d.status.padEnd(9)} ${d.id}`));
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
