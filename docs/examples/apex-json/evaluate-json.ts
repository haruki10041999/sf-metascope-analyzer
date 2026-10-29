/**
 * generate-json-pipeline.ts の出力（output/<sample>/）を評価し、5.evaluation.json に書き出す。
 *
 * 実行: npx ttsx --noCheck docs/examples/apex-json/evaluate-json.ts
 */
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

type Position = { offset: number; line: number; column: number };
type SourceJson = {
    objectKey: string;
    context: string;
    source: { sourceKey: string; start: Position; end: Position }[];
};

const outputDirectory = new URL('./output/', import.meta.url);
const sampleFiles: Record<string, URL> = {
    ParserTest: new URL('../apex-ir/ParserTest.cls', import.meta.url),
    ParserTrigger: new URL('../apex-ir/ParserTrigger.trigger', import.meta.url),
    parser: new URL('../apex-ir/parser.apex', import.meta.url),
    broken: new URL('./broken.apex', import.meta.url),
};

// CommonType のうち、ソース由来でない（変換器が付けた）値を持つキー
const COMMON_TYPE_META_KEYS = new Set(['type', 'sourceInfo', 'errorCode', 'contextType', 'valueType']);

const readJson = async <T>(url: URL): Promise<T> => JSON.parse(await readFile(url, 'utf8')) as T;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const walk = (target: unknown, visit: (node: Record<string, unknown>) => void): void => {
    if (Array.isArray(target)) {
        target.forEach((item) => walk(item, visit));
    } else if (isRecord(target)) {
        visit(target);
        Object.values(target).forEach((item) => walk(item, visit));
    }
};

const sizeOf = (value: unknown) => {
    const minified = JSON.stringify(value);
    return {
        minifiedBytes: Buffer.byteLength(minified),
        gzipBytes: gzipSync(minified).length,
    };
};

// ---- 値の保持率 ----------------------------------------------------------------

const countValues = (target: unknown, skipKeys: Set<string>, counts = new Map<string, number>()) => {
    if (Array.isArray(target)) {
        target.forEach((item) => countValues(item, skipKeys, counts));
    } else if (isRecord(target)) {
        for (const [key, value] of Object.entries(target)) {
            if (skipKeys.has(key)) {
                continue;
            }
            if (typeof value === 'string' || typeof value === 'number') {
                const text = String(value);
                counts.set(text, (counts.get(text) ?? 0) + 1);
            } else {
                countValues(value, skipKeys, counts);
            }
        }
    } else if (typeof target === 'string') {
        // 配列の要素として直接入っている文字列（名前の配列など）
        counts.set(target, (counts.get(target) ?? 0) + 1);
    }
    return counts;
};

const valueRetention = (commonType: unknown, json: unknown) => {
    const expected = countValues(commonType, COMMON_TYPE_META_KEYS);
    const actual = countValues(json, new Set(['sourceKeys']));
    let total = 0;
    let missing = 0;
    const missingValues: { value: string; missing: number; expected: number }[] = [];
    for (const [value, count] of expected) {
        total += count;
        const lack = Math.max(0, count - (actual.get(value) ?? 0));
        if (lack > 0) {
            missing += lack;
            missingValues.push({ value, missing: lack, expected: count });
        }
    }
    missingValues.sort((a, b) => b.missing - a.missing);
    return {
        total,
        retained: total - missing,
        rate: total === 0 ? 1 : (total - missing) / total,
        missingTop: missingValues.slice(0, 15),
    };
};

// ---- 位置情報のカバー率 ----------------------------------------------------------

const coverage = (sourceText: string, sourceObjects: SourceJson[]) => {
    const covered = new Uint8Array(sourceText.length);
    const coveredLines = new Set<number>();
    for (const object of sourceObjects) {
        for (const { start, end } of object.source) {
            covered.fill(1, start.offset, end.offset);
            for (let line = start.line; line <= end.line; line++) {
                coveredLines.add(line);
            }
        }
    }

    let chars = 0;
    let coveredChars = 0;
    for (let i = 0; i < sourceText.length; i++) {
        if (!/\s/.test(sourceText[i]!)) {
            chars++;
            coveredChars += covered[i]!;
        }
    }

    const lines = sourceText.split(/\r?\n/);
    const codeLines = lines
        .map((text, index) => ({ text: text.trim(), line: index + 1 }))
        .filter(({ text }) => text !== '' && !text.startsWith('//'));

    return {
        nonWhitespaceChars: chars,
        charRate: chars === 0 ? 1 : coveredChars / chars,
        codeLines: codeLines.length,
        lineRate:
            codeLines.length === 0
                ? 1
                : codeLines.filter(({ line }) => coveredLines.has(line)).length / codeLines.length,
    };
};

const spanStats = (sourceObjects: SourceJson[]) => {
    const lengths = sourceObjects
        .flatMap((object) => object.source.map(({ start, end }) => end.offset - start.offset))
        .sort((a, b) => a - b);
    const at = (rate: number) => lengths[Math.min(lengths.length - 1, Math.floor(lengths.length * rate))] ?? 0;
    return { count: lengths.length, median: at(0.5), p90: at(0.9), max: lengths.at(-1) ?? 0 };
};

// ---- JSON の構造 ----------------------------------------------------------------

const structure = (json: unknown, sourceObjects: SourceJson[]) => {
    const kinds = new Map<string, number>();
    let boundary = 0;
    let typeOnly = 0;
    let undiscriminated = 0;
    let unresolved = 0;
    const sourceKeySet = new Set(
        sourceObjects.flatMap((o) => o.source.map((s) => `${o.objectKey}\u0000${s.sourceKey}`)),
    );

    walk(json, (node) => {
        if ('kind' in node && isRecord(node.sourceKeys)) {
            boundary++;
            const kind = String(node.kind);
            kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
            const keys = node.sourceKeys as Record<string, unknown>;
            const pairs = 'objectKey' in keys ? [keys] : Object.values(keys).flat();
            for (const pair of pairs as { objectKey: string; sourceKey: string }[]) {
                if (!sourceKeySet.has(`${pair.objectKey}\u0000${pair.sourceKey}`)) {
                    unresolved++;
                }
            }
        } else if ('objectKey' in node && 'sourceKey' in node) {
            // sourceKeys の中身
        } else if ('type' in node || 'fileType' in node) {
            typeOnly++;
        } else {
            undiscriminated++;
        }
    });

    return {
        objects: boundary + typeOnly + undiscriminated,
        boundary,
        typeOnly,
        undiscriminated,
        unresolvedSourceKeys: unresolved,
        errorJson: kinds.get('error') ?? 0,
        kinds: Object.fromEntries([...kinds].sort((a, b) => b[1] - a[1])),
    };
};

const sharedObjects = (sourceObjects: SourceJson[]) => {
    const shared = sourceObjects.filter((o) => o.source.length > 1);
    return {
        objectKeys: sourceObjects.length,
        sharedObjectKeys: shared.length,
        maxSourcesPerObjectKey: Math.max(0, ...sourceObjects.map((o) => o.source.length)),
    };
};

// ---- 実行 ----------------------------------------------------------------------

const results = [];
for (const name of await readdir(outputDirectory)) {
    const sampleFile = sampleFiles[name];
    if (!sampleFile) {
        continue;
    }
    const directory = new URL(`./${name}/`, outputDirectory);
    const sourceText = await readFile(sampleFile, 'utf8');
    const { commonType } = await readJson<{ commonType: unknown }>(new URL('1.common-type.json', directory));
    const convertNode = await readJson<unknown>(new URL('2.convert-node.json', directory));
    const sourceAll = await readJson<SourceJson[]>(new URL('2.source-all.json', directory));
    const json = await readJson<unknown>(new URL('3.json.json', directory));
    const source = await readJson<SourceJson[]>(new URL('4.source.json', directory));

    const files: Record<string, number> = {};
    for (const file of ['1.common-type.json', '2.convert-node.json', '2.source-all.json', '3.json.json', '4.source.json']) {
        files[file] = (await stat(new URL(file, directory))).size;
    }

    // sourceKeys を除いた JSON（キー以外の中身の大きさ）
    const jsonWithoutKeys = JSON.parse(JSON.stringify(json, (key, value) => (key === 'sourceKeys' ? undefined : value)));

    const evaluation = {
        sample: name,
        size: {
            sourceBytes: Buffer.byteLength(sourceText),
            prettyFileBytes: files,
            commonType: sizeOf(commonType),
            convertNode: sizeOf(convertNode),
            json: sizeOf(json),
            jsonWithoutSourceKeys: sizeOf(jsonWithoutKeys),
            sourceAll: sizeOf(sourceAll),
            source: sizeOf(source),
        },
        coverage: {
            all: coverage(sourceText, sourceAll),
            regenerated: coverage(sourceText, source),
        },
        span: { all: spanStats(sourceAll), regenerated: spanStats(source) },
        values: valueRetention(commonType, json),
        structure: structure(json, source),
        objectKeys: { all: sharedObjects(sourceAll), regenerated: sharedObjects(source) },
    };
    await writeFile(new URL('5.evaluation.json', directory), `${JSON.stringify(evaluation, null, 2)}\n`, 'utf8');
    results.push(evaluation);
}

console.log(JSON.stringify(results, null, 1));
