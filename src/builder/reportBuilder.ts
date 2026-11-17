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
import { ReportDocument, type ReportIssue, validateReportDocument } from '../report/document';

import { attachSources } from './sources';

// レポートの文書 (src/report/document.ts) から HTML を作る (docs/implementation-roadmap.md 4.4)。
// 1. 文書の形を確かめる 2. データの宣言の provider を実行して state.data に入れる 3. props まで検証する
// 4. 事前にビルドした viewer の HTML (dist/viewer/report/index.html) に差し込む。実行時に Vite は使わない

/** HTML に入れる文書 (viewer の src/viewer/report/main.tsx が読む形) */
export type EmbeddedReport = {
    title: string;
    /** 何と何を比べたか (保存した基準 → 作業ツリー、main...HEAD など) */
    compared?: string;
    spec: Spec & { state: Record<string, unknown> };
};

/** resolveReport の選び方 (機密を伏せるかと、比べた 2 つの時点の説明) */
export type ResolveReportOptions = ReportRunOptions & {
    compared?: string;
    /** 警告する埋め込むデータの大きさ (既定は EMBEDDED_DATA_WARNING_BYTES) */
    warningBytes?: number;
};

export type ResolvedReport =
    | {
          ok: true;
          report: EmbeddedReport;
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

/**
 * 文書を解決する (provider を実行し、検証する)。問題があれば issues を返す。
 * provider の結果は、既定では機密になりうる値を伏せる (runReportProvider と同じ)
 */
export const resolveReport = (
    document: unknown,
    input: ReportInput,
    options: ResolveReportOptions = {},
): ResolvedReport => {
    const parsed = ReportDocument.safeParse(document);
    if (!parsed.success) {
        return {
            ok: false,
            issues: parsed.error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
            })),
        };
    }
    const doc = parsed.data;
    const issues: ReportIssue[] = [];
    const data: Record<string, unknown> = {};
    for (const [name, source] of Object.entries(doc.data)) {
        if (!isReportProviderName(source.provider)) {
            issues.push({
                path: `data.${name}.provider`,
                message: `Unknown provider: ${source.provider}`,
            });
            continue;
        }
        // 引数は登録表の zod で確かめる (誤りは引数の場所つきで返す)
        const args = providerDefinitionOf(source.provider).args.safeParse(source.args ?? {});
        if (!args.success) {
            for (const issue of args.error.issues) {
                issues.push({
                    path: `data.${name}.args${issue.path.length ? `.${issue.path.join('.')}` : ''}`,
                    message: issue.message,
                });
            }
            continue;
        }
        // 差分だけを返す provider は、比べる時点がなければ問題にする (空の表を黙って出さない)
        if (requiresComparison(source.provider) && !input.before) {
            issues.push({
                path: `data.${name}.provider`,
                message: comparisonRequiredMessage(source.provider),
            });
            continue;
        }
        try {
            const result = runReportProvider(source.provider, input, source.args, options);
            // withSource: 行にソースの抜き出しを付ける (削除された行は before、ほかは after のソース)
            data[name] = compactEmbeddedData(
                source.withSource ? attachSources(result, input) : result,
                input.after.root,
            );
        } catch (error) {
            issues.push({ path: `data.${name}`, message: `Provider failed: ${String(error)}` });
        }
    }
    // データを受け取る部品には、受け取れる形 (と provider) のデータだけを渡せる (report/catalog.ts の REPORT_DATA_BINDINGS)
    for (const [key, element] of Object.entries(doc.spec.elements)) {
        const binding = REPORT_DATA_BINDINGS[element.type as ReportComponentName];
        if (!binding) continue;
        const value = element.props[binding.prop] as { $state?: unknown } | undefined;
        const name =
            typeof value?.$state === 'string'
                ? value.$state.match(/^\/data\/([^/]+)$/)?.[1]
                : undefined;
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
    const state = { data };
    issues.push(...validateReportDocument(doc, issues.length === 0 ? state : undefined));
    if (issues.length > 0) return { ok: false, issues };
    // 大きさの目安を超えたら警告する (誤りにはしない。どのデータが大きいかも出す)
    const sizes = Object.entries(data).map(
        ([name, value]) => [name, JSON.stringify(value).length] as const,
    );
    const total = sizes.reduce((sum, [, size]) => sum + size, 0);
    const warnings: ReportIssue[] =
        total > (options.warningBytes ?? EMBEDDED_DATA_WARNING_BYTES)
            ? [
                  {
                      path: 'data',
                      message: `The embedded data is large (${(total / 1048576).toFixed(1)} MB; guideline ${((options.warningBytes ?? EMBEDDED_DATA_WARNING_BYTES) / 1048576).toFixed(1)} MB). Largest: ${[
                          ...sizes,
                      ]
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([name, size]) => `${name} ${(size / 1048576).toFixed(1)} MB`)
                          .join(
                              ', ',
                          )}. Narrow it with provider args (objects / classes / components / languages) or split the document.`,
                  },
              ]
            : [];
    return {
        ok: true,
        ...(warnings.length ? { warnings } : {}),
        report: {
            title: doc.title,
            ...(options.compared ? { compared: options.compared } : {}),
            spec: { ...(doc.spec as Spec), state },
        },
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
