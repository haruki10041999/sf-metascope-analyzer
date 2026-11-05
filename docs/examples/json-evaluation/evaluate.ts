/**
 * Apex と LWC の JSON (jsonType) を、実際に parse した結果で評価する (docs/json-type-evaluation.md)。
 * 観点: (1) 表現できているか (2) Diff を取りやすいか (3) 解析で使う属性が JsonType になっているか
 *
 * 実行: npx ttsx --noCheck docs/examples/json-evaluation/evaluate.ts
 * 出力: docs/examples/json-evaluation/output/evaluation.json
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ApexParser } from '../../../src/analyzer/parser/Apex';
import { LwcParser } from '../../../src/analyzer/parser/Lwc';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const rel = (p: string) => path.relative(root, p).replace(/\\/g, '/');

const APEX_FILES = [
    'docs/examples/apex-ir/ParserTest.cls',
    'docs/examples/apex-ir/ParserEnum.cls',
    'docs/examples/apex-ir/ParserInterface.cls',
    'docs/examples/apex-ir/ParserTrigger.trigger',
    'docs/examples/apex-ir/parser.apex',
    'docs/examples/apex-diff/after/AccountService.cls',
    'docs/examples/apex-diff/after/AccountTrigger.trigger',
    'docs/examples/apex-diff/after/Level.cls',
    'docs/examples/apex-diff/after/NewHelper.cls',
    'docs/examples/apex-diff/after/Shape.cls',
    'docs/examples/apex-diff/after/Unchanged.cls',
    'docs/examples/apex-diff/after/script.apex',
    'docs/examples/apex-diff/after/Broken.cls',
];

const LWC_BUNDLES = [
    'docs/examples/lwc/bundles/force-app/main/default/lwc/accountList',
    'docs/examples/lwc/bundles/force-app/main/default/lwc/accountRow',
    'docs/examples/lwc/bundles/force-app/main/default/lwc/utils',
    'docs/examples/lwc/bundles/force-app/main/default/lwc/broken',
    'docs/examples/lwc/ssr-snapshot/modules/c/hello',
    'docs/examples/lwc/ssr-snapshot/modules/c/child',
    'docs/examples/lwc/ssr-lbc/modules/c/demo',
];

type Json = Record<string, unknown>;
type Keys = { objectKey: string; sourceKey: string };

const isRecord = (v: unknown): v is Json =>
    v !== null && typeof v === 'object' && !Array.isArray(v);
/** kind と sourceKeys を持つ (JsonType / StructureJsonType / ErrorJson) */
const isJsonNode = (v: unknown): v is Json & { kind: string; sourceKeys: Json } =>
    isRecord(v) && typeof v.kind === 'string' && isRecord(v.sourceKeys);
const baseKeys = (node: { sourceKeys: Json }): Keys =>
    (isRecord(node.sourceKeys.base) ? node.sourceKeys.base : node.sourceKeys) as Keys;

/** JSON のノードを、親からのパス付きで前順にたどる */
const walkJson = (
    value: unknown,
    visit: (node: Json, parentKind: string | null) => void,
    parent: string | null = null,
) => {
    if (Array.isArray(value)) return value.forEach((v) => walkJson(v, visit, parent));
    if (!isRecord(value)) return;
    visit(value, parent);
    const kind = isJsonNode(value) ? value.kind : parent;
    for (const [k, v] of Object.entries(value)) if (k !== 'sourceKeys') walkJson(v, visit, kind);
};

// ---------------------------------------------------------------------------
// (1) 表現: ソースの識別子が JSON に残っているか
// ---------------------------------------------------------------------------

const KEYWORDS = new Set(
    // Apex
    (
        'abstract after before break catch class continue delete do else enum extends false final finally for get global if implements insert instanceof interface merge new null on override private protected public return set sharing static super switch testmethod this throw transient trigger true try undelete update upsert virtual void webservice when while with without list map system select from where limit order by and or not in like asc desc nulls first last group having offset for view reference update tracking viewstat all rows find returning ' +
        'integer string boolean decimal double long id date datetime time object blob sobject ' +
        // JS / TS
        'import export default const let var function async await yield typeof of type interface readonly as satisfies keyof unknown any number never undefined declare namespace module enum is infer extends'
    ).split(/\s+/),
);

/** コメントを除き、文字列リテラルの中身は別に返す */
const splitSource = (source: string) => {
    const strings: string[] = [];
    const code = source
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\/\/[^\n]*/g, ' ')
        .replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g, (m) => {
            strings.push(m.slice(1, -1));
            return ' ';
        });
    return { code, strings };
};

const identifiersOf = (code: string) =>
    new Set(
        [...code.matchAll(/[A-Za-z_$][\w$]*/g)]
            .map((m) => m[0])
            .filter((w) => !KEYWORDS.has(w.toLowerCase())),
    );

/** JSON の文字列の値を、「名前として持つ (値そのもの)」と「式の文字列の中にある」に分けて集める */
const jsonStrings = (json: unknown) => {
    const exact = new Set<string>();
    const texts: string[] = [];
    const visit = (v: unknown, key: string) => {
        if (typeof v === 'string') {
            if (key === 'objectKey' || key === 'sourceKey') return;
            exact.add(v);
            v.split(/[.\s]/).forEach((part) => exact.add(part));
            texts.push(v);
        } else if (Array.isArray(v)) v.forEach((x) => visit(x, key));
        else if (isRecord(v))
            for (const [k, x] of Object.entries(v)) if (k !== 'sourceKeys') visit(x, k);
    };
    visit(json, '');
    return { exact, text: texts.join('\n') };
};

const coverageOf = (source: string, json: unknown) => {
    const { code } = splitSource(source);
    const ids = identifiersOf(code);
    const { exact, text } = jsonStrings(json);
    const structured: string[] = [];
    const inText: string[] = [];
    const missing: string[] = [];
    for (const id of ids) {
        if (exact.has(id)) structured.push(id);
        else if (new RegExp(`(^|[^\\w$])${id.replace(/\$/g, '\\$')}([^\\w$]|$)`).test(text))
            inText.push(id);
        else missing.push(id);
    }
    return { identifiers: ids.size, structured: structured.length, inText: inText.length, missing };
};

// ---------------------------------------------------------------------------
// (3) 属性の表し方: kind ごと・フィールドごとに、値が JsonType か、ただの値か
// ---------------------------------------------------------------------------

type FieldShape =
    | 'json'
    | 'json[]'
    | '[]'
    | 'error'
    | 'string'
    | 'string[]'
    | 'number'
    | 'boolean'
    | 'object'
    | 'object[]'
    | 'null';
const shapeOf = (v: unknown): FieldShape => {
    if (v === null) return 'null';
    if (Array.isArray(v)) {
        if (v.length === 0) return '[]';
        if (v.every((x) => isJsonNode(x))) return 'json[]';
        if (v.every((x) => typeof x === 'string')) return 'string[]';
        return 'object[]';
    }
    if (isJsonNode(v)) return v.kind === 'error' ? 'error' : 'json';
    if (isRecord(v)) return 'object';
    return typeof v as FieldShape;
};

const fieldCensus = (jsons: unknown[]) => {
    const census = new Map<string, Map<string, Set<FieldShape>>>();
    for (const json of jsons) {
        walkJson(json, (node, parentKind) => {
            const owner = isJsonNode(node) ? node.kind : `(${parentKind ?? 'root'} の中の値)`;
            if (owner === 'error') return;
            const fields = census.get(owner) ?? new Map<string, Set<FieldShape>>();
            census.set(owner, fields);
            for (const [k, v] of Object.entries(node)) {
                if (k === 'kind' || k === 'sourceKeys') continue;
                const shapes = fields.get(k) ?? new Set<FieldShape>();
                fields.set(k, shapes);
                const shape = shapeOf(v);
                // 空の配列は、ほかの出現で形が分かるので数えない (全部空なら '[]')
                if (shape !== '[]' || shapes.size === 0) shapes.add(shape);
                if (shape !== '[]' && shapes.has('[]')) shapes.delete('[]');
            }
        });
    }
    return Object.fromEntries(
        [...census]
            .sort()
            .map(([kind, fields]) => [
                kind,
                Object.fromEntries([...fields].map(([f, s]) => [f, [...s].sort().join(' | ')])),
            ]),
    );
};

const kindCounts = (jsons: unknown[]) => {
    const counts = new Map<string, number>();
    for (const json of jsons)
        walkJson(json, (n) => isJsonNode(n) && counts.set(n.kind, (counts.get(n.kind) ?? 0) + 1));
    return Object.fromEntries([...counts].sort((a, b) => b[1] - a[1]));
};

// ---------------------------------------------------------------------------
// (2) Diff: 位置だけの変更・1 か所の変更で、objectKey がどう変わるか
// ---------------------------------------------------------------------------

const jsonNodes = (json: unknown) => {
    const nodes: (Json & { kind: string; sourceKeys: Json })[] = [];
    walkJson(json, (n) => isJsonNode(n) && n.kind !== 'error' && nodes.push(n));
    return nodes;
};

/** 配列の兄弟の JsonType で、objectKey が重なるもの (内容が同じ要素。objectKey だけでは対応付けられない) */
const siblingDuplicates = (json: unknown) => {
    let arrays = 0;
    let duplicated = 0;
    const examples = new Set<string>();
    const visit = (v: unknown) => {
        if (Array.isArray(v)) {
            const keys = v.filter(isJsonNode).map((n) => baseKeys(n).objectKey);
            if (keys.length > 1) {
                arrays++;
                const seen = new Set<string>();
                for (const [i, k] of keys.entries()) {
                    if (seen.has(k)) {
                        duplicated++;
                        examples.add(String((v[i] as Json).kind));
                    }
                    seen.add(k);
                }
            }
            v.forEach(visit);
        } else if (isRecord(v))
            Object.entries(v).forEach(([k, x]) => k !== 'sourceKeys' && visit(x));
    };
    visit(json);
    return { arrays, duplicated, kinds: [...examples] };
};

/** JsonType の配列の要素のうち、名前 (name / variant / source / key) で対応付けられるもの */
const identityCoverage = (json: unknown) => {
    const byKind: Record<string, { total: number; named: number }> = Object.create(null);
    const visit = (v: unknown) => {
        if (Array.isArray(v)) {
            for (const x of v) {
                if (!isJsonNode(x) || x.kind === 'error') continue;
                const entry = (byKind[x.kind as string] ??= { total: 0, named: 0 });
                entry.total++;
                const name = x.name ?? x.variant ?? x.source ?? x.local;
                if (typeof name === 'string' && name.length > 0) entry.named++;
            }
            v.forEach(visit);
        } else if (isRecord(v))
            Object.entries(v).forEach(([k, x]) => k !== 'sourceKeys' && visit(x));
    };
    visit(json);
    return byKind;
};

const withTempFile = async <T>(
    name: string,
    content: string,
    run: (file: string) => Promise<T>,
) => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'json-eval-'));
    const file = path.join(dir, name);
    await fs.writeFile(file, content);
    try {
        return await run(file);
    } finally {
        await fs.rm(dir, { recursive: true, force: true });
    }
};

const withTempBundle = async <T>(
    name: string,
    files: Record<string, string>,
    run: (dir: string) => Promise<T>,
) => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'json-eval-'));
    const bundle = path.join(dir, name);
    await fs.mkdir(bundle);
    for (const [f, c] of Object.entries(files)) await fs.writeFile(path.join(bundle, f), c);
    try {
        return await run(bundle);
    } finally {
        await fs.rm(dir, { recursive: true, force: true });
    }
};

/** before と after の JsonType を objectKey で比べる */
const compareKeys = (before: unknown, after: unknown) => {
    const b = jsonNodes(before);
    const a = jsonNodes(after);
    const beforeObjects = new Set(b.map((n) => baseKeys(n).objectKey));
    const beforeSources = new Set(b.map((n) => baseKeys(n).sourceKey));
    const changedObject = a.filter((n) => !beforeObjects.has(baseKeys(n).objectKey));
    const changedSource = a.filter((n) => !beforeSources.has(baseKeys(n).sourceKey));
    return {
        nodes: a.length,
        objectKeyChanged: changedObject.length,
        objectKeyChangedKinds: changedObject.map((n) => n.kind),
        sourceKeyChanged: changedSource.length,
    };
};

const parseApexSource = async (name: string, source: string) =>
    withTempFile(name, source, async (file) => (await ApexParser.parseApexClass(file)).result.base);

const parseLwcSource = async (bundle: string, fileName: string, source: string) =>
    withTempBundle(
        bundle,
        { [fileName]: source },
        async (dir) => (await LwcParser.parseLwcBundle(dir)).result.base,
    );

/** 1 か所だけ変えたときに objectKey が変わるのは、変えたノードとその祖先だけか */
const editExperiments = async () => {
    const apexSource = (
        await fs.readFile(
            path.join(root, 'docs/examples/apex-diff/after/AccountService.cls'),
            'utf8',
        )
    ).replace(/\r\n?/g, '\n');
    const lwcSource = (
        await fs.readFile(path.join(root, LWC_BUNDLES[0]!, 'accountList.ts'), 'utf8')
    ).replace(/\r\n?/g, '\n');
    const apexBase = await parseApexSource('AccountService.cls', apexSource);
    const lwcBase = await parseLwcSource('accountList', 'accountList.ts', lwcSource);

    const replaceOnce = (s: string, from: string, to: string) => {
        if (!s.includes(from)) throw new Error(`not found: ${from}`);
        return s.replace(from, to);
    };
    return {
        apex: {
            positionOnly: compareKeys(
                apexBase,
                await parseApexSource('AccountService.cls', `// header\n\n${apexSource}`),
            ),
            literal: compareKeys(
                apexBase,
                await parseApexSource(
                    'AccountService.cls',
                    replaceOnce(
                        apexSource,
                        'ORDER BY Name ASC LIMIT 200',
                        'ORDER BY Name ASC LIMIT 100',
                    ),
                ),
            ),
        },
        lwc: {
            positionOnly: compareKeys(
                lwcBase,
                await parseLwcSource('accountList', 'accountList.ts', `// header\n\n${lwcSource}`),
            ),
            literal: compareKeys(
                lwcBase,
                await parseLwcSource(
                    'accountList',
                    'accountList.ts',
                    replaceOnce(
                        lwcSource,
                        '@api maxRows?: number = 10;',
                        '@api maxRows?: number = 20;',
                    ),
                ),
            ),
            methodBody: compareKeys(
                lwcBase,
                await parseLwcSource(
                    'accountList',
                    'accountList.ts',
                    replaceOnce(
                        lwcSource,
                        "this.viewMode === 'table'",
                        "this.viewMode !== 'table'",
                    ),
                ),
            ),
        },
    };
};

// ---------------------------------------------------------------------------

const main = async () => {
    const apex: {
        file: string;
        json: unknown;
        coverage: ReturnType<typeof coverageOf>;
        errors: number;
    }[] = [];
    for (const file of APEX_FILES) {
        const absolute = path.join(root, file);
        const result = await ApexParser.parseApexClass(absolute);
        const source = (await fs.readFile(absolute, 'utf8')).replace(/\r\n?/g, '\n');
        const json = result.result.base;
        let errors = 0;
        walkJson(json, (n) => isJsonNode(n) && n.kind === 'error' && errors++);
        apex.push({ file, json, coverage: coverageOf(source, json), errors });
    }

    const lwc: {
        bundle: string;
        json: unknown;
        coverage: ReturnType<typeof coverageOf>;
        errors: number;
        resolvedError: number;
    }[] = [];
    for (const bundle of LWC_BUNDLES) {
        const absolute = path.join(root, bundle);
        const result = await LwcParser.parseLwcBundle(absolute);
        const files = (await fs.readdir(absolute)).filter(
            (f) => /\.(js|ts)$/.test(f) && !f.endsWith('.d.ts'),
        );
        const source = (
            await Promise.all(files.map((f) => fs.readFile(path.join(absolute, f), 'utf8')))
        ).join('\n');
        const json = result.result.base;
        let errors = 0;
        walkJson(json, (n) => isJsonNode(n) && n.kind === 'error' && errors++);
        lwc.push({
            bundle,
            json,
            coverage: coverageOf(source, json),
            errors,
            resolvedError: result.resolvedError.length,
        });
    }

    const summarize = (items: { coverage: ReturnType<typeof coverageOf> }[]) => {
        const total = items.reduce(
            (s, i) => ({
                identifiers: s.identifiers + i.coverage.identifiers,
                structured: s.structured + i.coverage.structured,
                inText: s.inText + i.coverage.inText,
                missing: s.missing + i.coverage.missing.length,
            }),
            { identifiers: 0, structured: 0, inText: 0, missing: 0 },
        );
        return total;
    };

    const evaluation = {
        apex: {
            files: apex.map((a) => ({ file: a.file, errorJson: a.errors, ...a.coverage })),
            coverage: summarize(apex),
            kinds: kindCounts(apex.map((a) => a.json)),
            fields: fieldCensus(apex.map((a) => a.json)),
            siblingDuplicates: siblingDuplicates(apex.map((a) => a.json)),
            identity: identityCoverage(apex.map((a) => a.json)),
        },
        lwc: {
            bundles: lwc.map((l) => ({
                bundle: l.bundle,
                errorJson: l.errors,
                resolvedError: l.resolvedError,
                ...l.coverage,
            })),
            coverage: summarize(lwc),
            kinds: kindCounts(lwc.map((l) => l.json)),
            fields: fieldCensus(lwc.map((l) => l.json)),
            siblingDuplicates: siblingDuplicates(lwc.map((l) => l.json)),
            identity: identityCoverage(lwc.map((l) => l.json)),
        },
        edits: await editExperiments(),
    };

    const outputDir = path.join(here, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(
        path.join(outputDir, 'evaluation.json'),
        `${JSON.stringify(evaluation, null, 2)}\n`,
    );
    console.log(`wrote ${rel(path.join(outputDir, 'evaluation.json'))}`);
    console.log(
        JSON.stringify(
            {
                apex: evaluation.apex.coverage,
                lwc: evaluation.lwc.coverage,
                edits: evaluation.edits,
            },
            null,
            1,
        ),
    );
};

await main();
