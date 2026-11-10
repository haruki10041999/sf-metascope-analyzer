// IR v2 を本来の流れにつなぐときの比べる基準 (ゴールデン)。docs/ir-integration.md 3.0
// サンプル (docs/examples/repository) の Apex・LWC の JS / TS を今の流れで JSON にし、キーの値を除いた形にそろえる。
// make-golden.ts が保存し、golden.test.ts が今の出力と比べる
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { REPOSITORY } from '../../docs/examples/paths';
import { getApexSourceFileType, parseApexSource } from '../../src/analyzer/parser/Apex/source';
import { convertLwcModule, parseLwcModule } from '../../src/analyzer/parser/Lwc/module';

export const GOLDEN_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'golden');

const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : walk(p);
        return [p];
    });

const isLwcScript = (file: string) =>
    /[\\/]lwc[\\/]/.test(file) && /\.(js|ts)$/.test(file) && !file.endsWith('.d.ts');

/** 比べる入力 (REPOSITORY からの相対パス。区切りは /) */
export const goldenInputs = (): string[] =>
    walk(REPOSITORY)
        .filter((file) => getApexSourceFileType(path.basename(file)) || isLwcScript(file))
        .map((file) => path.relative(REPOSITORY, file).split(path.sep).join('/'))
        .sort();

type Span = { start: unknown; end: unknown };

/** キー (objectKey・sourceKey) を除く。値は IR の形で変わるので比べない */
const stripKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(stripKeys);
    if (value === null || typeof value !== 'object') return value;
    return Object.fromEntries(
        Object.entries(value)
            .filter(([key]) => key !== 'objectKey' && key !== 'sourceKey')
            .map(([key, child]) => [key, stripKeys(child)]),
    );
};

/** ソース位置の一覧は、キーを除いた位置と context だけを、順に依らない形にする */
const normalizeSourceObjects = (
    objects: { context: string; source: Span[] }[],
): { context: string; start: unknown; end: unknown }[] =>
    objects
        .flatMap((object) =>
            object.source.map((s) => ({ context: object.context, start: s.start, end: s.end })),
        )
        .map((entry) => ({ key: JSON.stringify(entry), entry }))
        .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
        .map(({ entry }) => entry);

/** 1 つの入力の今の出力 (比べる形) */
export const goldenOutputOf = async (relative: string): Promise<unknown> => {
    const file = path.join(REPOSITORY, ...relative.split('/'));
    const source = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    if (getApexSourceFileType(path.basename(file))) {
        const result = await parseApexSource(path.basename(file), source);
        return {
            source: stripKeys(result.source),
            sourceObject: normalizeSourceObjects(result.sourceObject),
            resolvedError: stripKeys(result.resolvedError),
        };
    }
    // LWC のファイルのパスは、バンドルのフォルダの親からの相対 (hello/hello.ts)
    const filePath = relative.split('/').slice(-2).join('/');
    const parsed = parseLwcModule(filePath, source);
    const converted = convertLwcModule(parsed);
    return {
        module: stripKeys(converted.module),
        sourceObject: normalizeSourceObjects(converted.sourceObjects),
        resolvedError: stripKeys(parsed.resolvedError),
    };
};

export const goldenFileOf = (relative: string): string =>
    path.join(GOLDEN_DIR, ...relative.split('/')) + '.json';

export const serializeGolden = (output: unknown): string => `${JSON.stringify(output, null, 2)}\n`;
