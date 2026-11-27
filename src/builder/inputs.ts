import path from 'node:path';

import type { ReportInput } from '../analyzer/report';
import { CompareRange } from '../analyzer/unit/gitRange';
import type { RepositoryProcessor } from '../analyzer/unit/processor';
import { comparisonKey, comparisonsOf } from '../report/document';

import type { ResolveReportOptions } from './reportBuilder';

// レポートを作るときの入力 (比べる時点) と書き出す先。MCP のツール (mcp/reportTools.ts) と CLI (cli/index.ts) で共通

/**
 * 比べる時点。既定は今の状態だけ (1 時点。すべてを返し、status は付けない)。
 * git の範囲は引数の compare → 文書の compare、保存した基準との比較は引数の diff → 文書の diff の順に使う
 */
export const comparedInputOf = async (
    processor: RepositoryProcessor,
    compare: CompareRange | undefined,
    diff: boolean | undefined,
    document?: unknown,
) => {
    const fromDocument = document as { compare?: unknown; diff?: unknown } | undefined;
    const documentRange = CompareRange.safeParse(fromDocument?.compare);
    const range = compare ?? (documentRange.success ? documentRange.data : undefined);
    return processor.getComparedInput(range, {
        diff: diff ?? fromDocument?.diff === true,
    });
};

/**
 * 文書のデータが自分の比べ方 (diff・compare) を持つとき、その入力を先に読む (同じ比べ方は 1 回だけ)。
 * resolveReport の inputFor に渡す
 */
export const inputForOf = async (
    processor: RepositoryProcessor,
    document: unknown,
): Promise<NonNullable<ResolveReportOptions['inputFor']>> => {
    const loaded = new Map<string, { input: ReportInput; compared: string }>();
    for (const comparison of comparisonsOf(document)) {
        loaded.set(
            comparisonKey(comparison),
            await processor.getComparedInput(
                comparison.kind === 'range' ? comparison.range : undefined,
                { diff: comparison.kind === 'diff' },
            ),
        );
    }
    return (comparison) => loaded.get(comparisonKey(comparison));
};

/** 埋め込んだデータの件数 (行の並びは件数、ほかは null) */
export const dataSummaryOf = (state: Record<string, unknown>) =>
    Object.fromEntries(
        Object.entries((state.data ?? {}) as Record<string, unknown>).map(([name, value]) => [
            name,
            Array.isArray(value) ? value.length : null,
        ]),
    );

/** ファイル名に使えない文字を除く */
export const toFileName = (name: string) =>
    name
        .trim()
        .replace(/[\\/:*?"<>|\s]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'report';

/**
 * 書き出す先。ページに分けた文書は <フォルダ>/<名前>/index.html (pages/ はその隣)、
 * そうでなければ <フォルダ>/<名前>.html
 */
export const reportOutputOf = (directory: string, name: string, hasPages: boolean): string =>
    hasPages
        ? path.join(directory, toFileName(name), 'index.html')
        : path.join(directory, `${toFileName(name)}.html`);
