import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Spec } from '@json-render/core';

import {
    type ReportInput,
    type ReportRunOptions,
    comparisonRequiredMessage,
    isReportProviderName,
    providerDefinitionOf,
    requiresComparison,
    runReportProvider,
} from '../analyzer/report';
import { REPORT_DATA_BINDINGS, type ReportComponentName, acceptsData } from '../report/catalog';
import { COMPARED_PROP, type EmbeddedReport, dataNameOf } from '../report/embedding';
import { sameJsonValue, valueAtPath } from './values';
import { expandShorthand } from '../report/shorthand';
import {
    type DataComparison,
    type ReportDataSource,
    ReportDocument,
    type ReportIssue,
    comparisonKey,
    comparisonOfSource,
    normalizeReportDocument,
    validateReportDocument,
} from '../report/document';

import { expandReportDocument, readablePath } from './expand';
import { splitPages } from './pages';
import { attachSources } from './sources';

// レポートの文書 (src/report/document.ts) から HTML を作る (docs/implementation-roadmap.md 4.4)。
// 1. 文書の形を確かめる 2. データの宣言の provider を実行して state.data に入れる 3. props まで検証する
// 4. 事前にビルドした viewer の HTML (dist/viewer/report/index.html) に差し込む。実行時に Vite は使わない

/** HTML に入れる文書 (viewer の src/viewer/report/main.tsx が読む形) */
/** HTML に埋め込む文書 (型は viewer と共通。src/report/embedding.ts) */
export type { EmbeddedReport };

/** resolveReport の選び方 (機密を伏せるかと、比べた 2 つの時点の説明) */
export type ResolveReportOptions = ReportRunOptions & {
    compared?: string;
    /**
     * データの宣言が自分の比べ方 (diff・compare) を持つときの入力と、その説明。
     * 返さなければ (読んでいなければ) 問題にする。MCP のツールは比べ方ごとに先に読む (reportTools.ts の inputForOf)
     */
    inputFor?: (comparison: DataComparison) => { input: ReportInput; compared: string } | undefined;
    /** 文書の引数の値 (文書の params の default より優先。${params.x} で使う) */
    params?: Record<string, unknown>;
    /** 警告する埋め込むデータの大きさ (既定は EMBEDDED_DATA_WARNING_BYTES) */
    warningBytes?: number;
};

export type ResolvedReport =
    | {
          ok: true;
          report: EmbeddedReport;
          /** 1 件 1 ページに分けたページ (file は目次からの相対パス pages/<名前>.html)。分けなければ持たない */
          pages?: { file: string; report: EmbeddedReport }[];
          /** 誤りではないが知らせること (埋め込むデータが大きいなど)。なければ持たない */
          warnings?: ReportIssue[];
      }
    | { ok: false; issues: ReportIssue[] };

/**
 * 埋め込むデータの大きさの目安 (これを超えたら警告する。誤りにはしない)。
 * NPSP (Apex のクラス 1,035・ファイル 1.1 万) で、Apex の仕様書が約 19 MB・翻訳の状況が約 14 MB になった
 * (docs/implementation-roadmap.md 8 章の M1)。範囲 (objects・classes・components・languages) で絞るか、文書を分ける
 */
export const EMBEDDED_DATA_WARNING_BYTES = 8 * 1024 * 1024;

/**
 * HTML に埋め込むデータを軽くする。位置のキー (sourceKeys) は画面で使わないので落とし、
 * ファイルのパスはリポジトリからの相対パスにする (手元のフォルダ名・ユーザー名を、共有する HTML に入れない)
 */
export const compactEmbeddedData = (value: unknown, root: string): unknown => {
    if (Array.isArray(value)) return value.map((item) => compactEmbeddedData(item, root));
    if (typeof value !== 'object' || value === null) return value;
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
        if (key === 'sourceKeys') continue;
        if (key === 'filePath' && typeof child === 'string' && path.isAbsolute(child)) {
            const relative = path.relative(root, child);
            out[key] = relative.startsWith('..')
                ? path.basename(child)
                : relative.split(path.sep).join('/');
            continue;
        }
        out[key] = compactEmbeddedData(child, root);
    }
    return out;
};

/** データが自分の比べ方を持つ部品に、比べた時点を指す props (COMPARED_PROP) を足す */
const withComparedLabels = (
    spec: ReportDocument['spec'],
    comparedOf: Record<string, string>,
): ReportDocument['spec'] => {
    if (!Object.keys(comparedOf).length) return spec;
    const elements: ReportDocument['spec']['elements'] = {};
    for (const [key, element] of Object.entries(spec.elements)) {
        const binding = REPORT_DATA_BINDINGS[element.type as ReportComponentName];
        const name = binding ? dataNameOf(element.props[binding.prop]) : undefined;
        elements[key] =
            name && name in comparedOf
                ? {
                      ...element,
                      props: { ...element.props, [COMPARED_PROP]: { $state: `/compared/${name}` } },
                  }
                : element;
    }
    return { ...spec, elements };
};

/** 部品に書いたデータの問題 (data.<名前>...) を、書いた場所 (spec.<部品>.data...) で返す */
const originOf =
    (origins: Record<string, string>) =>
    (issue: ReportIssue): ReportIssue => {
        const match = issue.path.match(/^data\.([^.]+)(.*)$/);
        const key = match ? origins[match[1]!] : undefined;
        return key ? { ...issue, path: `spec.${key}.data${match![2]}` } : issue;
    };

/** データの宣言を実行した結果 (比べ方を持つデータは、その説明も) */
type SourceResult = { value: unknown; compared?: string };

/**
 * データの宣言を実行する関数を作る。同じ宣言 (provider・引数・比べ方) の結果は使い回す
 * (for の行・if の hasRows・展開した要素のデータで、同じ宣言が何度も出てくるため)。
 * 失敗なら undefined を返し、問題を path の場所で積む (同じ宣言の 2 回目からは積まない)
 */
export const sourceRunner = (
    input: ReportInput,
    options: ResolveReportOptions,
    issues: ReportIssue[],
): ((source: ReportDataSource, path: string) => SourceResult | undefined) => {
    const cache = new Map<string, SourceResult | undefined>();
    return (source, path) => {
        const cacheKey = JSON.stringify(source);
        if (cache.has(cacheKey)) return cache.get(cacheKey);
        const result = runSource(source, path, input, options, issues);
        cache.set(cacheKey, result);
        return result;
    };
};

/** 行の項目 (a.b の形も) */
const fieldOf = (row: unknown, field: string): unknown => valueAtPath(row, field.split('.'));

/** where の項目がすべて合う行だけにする (値が配列なら、そのどれか) */
const filterRows = (rows: unknown[], where: Record<string, unknown>): unknown[] =>
    rows.filter((row) =>
        Object.entries(where).every(([field, expected]) =>
            Array.isArray(expected)
                ? expected.some((item) => sameJsonValue(fieldOf(row, field), item))
                : sameJsonValue(fieldOf(row, field), expected),
        ),
    );

const runSource = (
    source: ReportDataSource,
    path: string,
    input: ReportInput,
    options: ResolveReportOptions,
    issues: ReportIssue[],
): SourceResult | undefined => {
    if (!isReportProviderName(source.provider)) {
        issues.push({ path: `${path}.provider`, message: `Unknown provider: ${source.provider}` });
        return undefined;
    }
    // 引数は登録表の zod で確かめる (誤りは引数の場所つきで返す)
    const args = providerDefinitionOf(source.provider).args.safeParse(source.args ?? {});
    if (!args.success) {
        for (const issue of args.error.issues) {
            issues.push({
                path: `${path}.args${issue.path.length ? `.${issue.path.join('.')}` : ''}`,
                message: issue.message,
            });
        }
        return undefined;
    }
    // データが自分の比べ方を持てば、その入力を使う
    const comparison = comparisonOfSource(source);
    const own = comparison ? options.inputFor?.(comparison) : undefined;
    if (comparison && !own) {
        issues.push({
            path,
            message: `No input for the comparison of this data (${comparisonKey(comparison)}). Build it with the MCP tools, which load each comparison.`,
        });
        return undefined;
    }
    const dataInput = own?.input ?? input;
    // 差分だけを返す provider は、比べる時点がなければ問題にする (空の表を黙って出さない)
    if (requiresComparison(source.provider) && !dataInput.before) {
        issues.push({
            path: `${path}.provider`,
            message: comparisonRequiredMessage(source.provider),
        });
        return undefined;
    }
    try {
        const all = runReportProvider(source.provider, dataInput, source.args, options);
        // where: 行の項目の値で絞る (行のデータだけ)
        if (source.where && !Array.isArray(all)) {
            issues.push({
                path: `${path}.where`,
                message: `where needs rows (an array), but ${source.provider} returns an object.`,
            });
            return undefined;
        }
        const result = source.where ? filterRows(all as unknown[], source.where) : all;
        // withSource: 行にソースの抜き出しを付ける (削除された行は before、ほかは after のソース)
        const value = compactEmbeddedData(
            source.withSource ? attachSources(result, dataInput) : result,
            dataInput.after.root,
        );
        return own ? { value, compared: own.compared } : { value };
    } catch (error) {
        issues.push({ path, message: `Provider failed: ${String(error)}` });
        return undefined;
    }
};

/** 問題の場所を、書いた場所で返す (部品に書いたデータ → spec.<部品>.data、繰り返した要素 key__3 → key[3]) */
const readableIssue =
    (origins: Record<string, string>) =>
    (issue: ReportIssue): ReportIssue => {
        const origin = originOf(origins)(issue);
        return { ...origin, path: readablePath(origin.path) };
    };

/**
 * 文書を解決する (for / if / $note を展開し、provider を実行し、検証する)。問題があれば issues を返す。
 * provider の結果は、既定では機密になりうる値を伏せる (runReportProvider と同じ)
 */
export const resolveReport = (
    document: unknown,
    input: ReportInput,
    options: ResolveReportOptions = {},
): ResolvedReport => {
    // 省略と短い書き方を、今の形に直してから確かめる (report/shorthand.ts)
    const parsed = ReportDocument.safeParse(expandShorthand(document));
    if (!parsed.success) {
        return {
            ok: false,
            issues: parsed.error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
            })),
        };
    }
    const issues: ReportIssue[] = [];
    const run = sourceRunner(input, options, issues);
    // 1. for / if / $note を展開する (for の行・if の hasRows は、ここでデータを実行して決める)
    const expanded = expandReportDocument(
        parsed.data,
        (source, path) => run(source, path)?.value,
        options.params,
    );
    issues.push(...expanded.issues);
    // 2. 部品に書いたデータを data に移す (問題の場所は、書いた部品の場所で返す)
    const normalized = normalizeReportDocument(expanded.document);
    const doc = normalized.document;
    issues.push(...normalized.issues);
    // 3. データの宣言を実行する
    const data: Record<string, unknown> = {};
    /** データごとの比べ方の説明 (自分の比べ方を持つデータだけ。viewer が部品の上に出す) */
    const comparedOf: Record<string, string> = {};
    for (const [name, source] of Object.entries(doc.data)) {
        const result = run(source, `data.${name}`);
        if (!result) continue;
        data[name] = result.value;
        if (result.compared !== undefined) comparedOf[name] = result.compared;
    }
    // データを受け取る部品には、受け取れる形 (と provider) のデータだけを渡せる (report/catalog.ts の REPORT_DATA_BINDINGS)
    for (const [key, element] of Object.entries(doc.spec.elements)) {
        const binding = REPORT_DATA_BINDINGS[element.type as ReportComponentName];
        if (!binding) continue;
        const name = dataNameOf(element.props[binding.prop]);
        const provider = name ? doc.data[name]?.provider : undefined;
        if (!provider || !isReportProviderName(provider)) continue;
        const shape = providerDefinitionOf(provider).shape;
        if (!acceptsData(binding, provider, shape)) {
            const accepted = [...(binding.shapes ?? []), ...(binding.providers ?? [])].join(', ');
            issues.push({
                path: `spec.${key}.props.${binding.prop}`,
                message: `${element.type} does not accept ${provider} (${shape}). It accepts: ${accepted}`,
            });
        }
    }
    const state = { data, ...(Object.keys(comparedOf).length ? { compared: comparedOf } : {}) };
    issues.push(...validateReportDocument(doc, issues.length === 0 ? state : undefined));
    const readable = readableIssue(normalized.origins);
    if (issues.length > 0) return { ok: false, issues: issues.map(readable) };
    const warnings: ReportIssue[] = expanded.warnings.map(readable);
    // 1 件 1 ページに分ける (page を持つ要素。pages.ts)
    const split = splitPages(withComparedLabels(doc.spec, comparedOf), state);
    warnings.push(...split.warnings.map(readable));
    // 大きさの目安を超えたら警告する (誤りにはしない。どのデータが大きいかも出す。ページごとに見る)
    const limit = options.warningBytes ?? EMBEDDED_DATA_WARNING_BYTES;
    const sizeWarning = (path: string, pageData: Record<string, unknown>) => {
        const sizes = Object.entries(pageData).map(
            ([name, value]) => [name, JSON.stringify(value).length] as const,
        );
        const total = sizes.reduce((sum, [, size]) => sum + size, 0);
        if (total <= limit) return;
        const largest = [...sizes]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, size]) => `${name} ${(size / 1048576).toFixed(1)} MB`)
            .join(', ');
        warnings.push({
            path,
            message: `The embedded data is large (${(total / 1048576).toFixed(1)} MB; guideline ${(limit / 1048576).toFixed(1)} MB). Largest: ${largest}. Split it into pages (page on a for element) or show fewer columns / components.`,
        });
    };
    sizeWarning('data', split.state.data);
    for (const page of split.pages) sizeWarning(`pages.${page.file}`, page.state.data);
    const compared = options.compared ? { compared: options.compared } : {};
    return {
        ok: true,
        ...(warnings.length ? { warnings } : {}),
        report: {
            title: doc.title,
            ...compared,
            spec: { ...(split.spec as Spec), state: split.state },
        },
        ...(split.pages.length
            ? {
                  pages: split.pages.map((page) => ({
                      file: page.file,
                      report: {
                          title: page.title,
                          ...compared,
                          parent: { title: doc.title, href: '../index.html' },
                          spec: { ...(page.spec as Spec), state: page.state },
                      },
                  })),
              }
            : {}),
    };
};

const PLACEHOLDER = /<script type="application\/json" id="metascope-report">[\s\S]*?<\/script>/;

/** HTML の script に入れても壊れないように JSON を書く (</script> と行区切りの文字をエスケープする) */
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

const toScriptJson = (value: unknown) =>
    JSON.stringify(value)
        .replaceAll('<', '\\u003c')
        .replaceAll(LINE_SEPARATOR, '\\u2028')
        .replaceAll(PARAGRAPH_SEPARATOR, '\\u2029');

/** 事前にビルドした viewer の HTML (ソースから動かすときと、ビルド版 (dist/node) のときの両方を探す) */
export const defaultReportTemplate = (): string => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const candidates = [
        path.resolve(here, '../../dist/viewer/report/index.html'),
        path.resolve(here, '../../viewer/report/index.html'),
    ];
    const found = candidates.find((candidate) => existsSync(candidate));
    if (!found) {
        throw new Error(
            `レポートの viewer がビルドされていません (npm run build:report)。探した場所: ${candidates.join(', ')}`,
        );
    }
    return found;
};

/** 解決した文書を HTML にして書く。書いたパスを返す */
export const writeReportHtml = async (
    report: EmbeddedReport,
    outputPath: string,
    templatePath: string = defaultReportTemplate(),
): Promise<string> => {
    const template = await fs.readFile(templatePath, 'utf8');
    if (!PLACEHOLDER.test(template)) {
        throw new Error(`レポートの viewer の HTML に文書の置き場がありません: ${templatePath}`);
    }
    const html = template.replace(
        PLACEHOLDER,
        () =>
            `<script type="application/json" id="metascope-report">${toScriptJson(report)}</script>`,
    );
    const absolute = path.resolve(outputPath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, html);
    return absolute;
};

/**
 * 解決した文書を HTML にして書く。ページに分けた文書なら、outputPath を目次にし、
 * 同じフォルダの pages/ に各ページを書く。書いた目次のパスを返す
 */
export const writeReportSite = async (
    resolved: { report: EmbeddedReport; pages?: { file: string; report: EmbeddedReport }[] },
    outputPath: string,
    templatePath: string = defaultReportTemplate(),
): Promise<string> => {
    const index = await writeReportHtml(resolved.report, outputPath, templatePath);
    for (const page of resolved.pages ?? []) {
        await writeReportHtml(page.report, path.join(path.dirname(index), page.file), templatePath);
    }
    return index;
};
