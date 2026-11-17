import { useState } from 'react';

import { StatusBadge, isStatus } from './status';

// 行の並びの表 (DataTable と、ほかの部品の中の表で共通)

export type Row = Record<string, unknown>;
export type Column = { key: string; label: string };

/**
 * 列を指定しないときに出さない列 (位置・ソースの抜き出し・ファイルのパス)。
 * ファイルのパスは長く読みにくいので、要るときは columns で指定する
 */
const HIDDEN_COLUMNS = new Set(['sourceKeys', '_source', 'filePath']);

/** 折り返さない短い値 (はい・いいえ・数・短い名前) */
const SHORT_TEXT = 12;

/** 1 ページの行の数 (大きい組織では数万行になるので、一度に描かない) */
const PAGE_SIZE = 200;
/** これより行が多ければ、絞り込みの入力欄を出す */
const FILTER_FROM = 20;

export const columnsOf = (rows: Row[]): Column[] => {
    const keys = new Set<string>();
    for (const row of rows) for (const key of Object.keys(row)) keys.add(key);
    // status を先頭にする
    return [...keys]
        .filter((key) => !HIDDEN_COLUMNS.has(key))
        .sort((a, b) => (a === 'status' ? -1 : b === 'status' ? 1 : 0))
        .map((key) => ({ key, label: key }));
};

export const cellText = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'boolean') return value ? 'はい' : 'いいえ';
    if (Array.isArray(value)) return value.map(cellText).join(', ');
    if (typeof value === 'object') {
        // 権限の持ち主 ({ type, name }) などは名前で出す
        const named = value as { name?: unknown };
        if (typeof named.name === 'string') return named.name;
        return JSON.stringify(value);
    }
    return String(value);
};

type SourceExcerpt = { filePath: string; startLine: number; text: string; truncated?: boolean };

const isExcerpt = (value: unknown): value is SourceExcerpt =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as SourceExcerpt).text === 'string' &&
    typeof (value as SourceExcerpt).startLine === 'number';

/** ソースの抜き出し (行番号つき。開いたときだけ見せる) */
export const SourceSnippet = ({ excerpt }: { excerpt: SourceExcerpt }) => {
    const lines = excerpt.text.split('\n');
    return (
        <details className="text-xs">
            <summary className="text-muted-foreground cursor-pointer whitespace-nowrap">
                {excerpt.filePath}:{excerpt.startLine}
            </summary>
            <pre className="bg-muted mt-1 max-h-80 overflow-auto rounded-md p-2 font-mono leading-snug">
                {lines.map((line, index) => (
                    <div key={index} className="flex gap-3">
                        <span className="text-muted-foreground w-8 shrink-0 text-right select-none">
                            {excerpt.startLine + index}
                        </span>
                        <span className="whitespace-pre">{line}</span>
                    </div>
                ))}
                {excerpt.truncated && <div className="text-muted-foreground">…</div>}
            </pre>
        </details>
    );
};

export const RowsTable = ({
    rows,
    columns,
    caption,
    showSource,
}: {
    rows: Row[];
    columns?: Column[] | null | undefined;
    caption?: string | null | undefined;
    showSource?: boolean | null | undefined;
}) => {
    const shown = columns ?? columnsOf(rows);
    const width = shown.length + (showSource ? 1 : 0);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    // 絞り込み: 表に出している列のどれかに、入力した文字列を含む行 (大文字・小文字を区別しない)
    const needle = query.trim().toLowerCase();
    const filtered = needle
        ? rows.filter((row) =>
              shown.some((column) => cellText(row[column.key]).toLowerCase().includes(needle)),
          )
        : rows;
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pages - 1);
    const visible = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
    return (
        <div className="flex w-full flex-col gap-2">
            {rows.length > FILTER_FROM && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(0);
                        }}
                        placeholder="絞り込み (どの列でも)"
                        className="bg-background h-7 w-56 rounded border px-2"
                    />
                    <span className="text-muted-foreground">
                        {needle ? `${filtered.length} / ${rows.length} 行` : `${rows.length} 行`}
                    </span>
                    {pages > 1 && (
                        <span className="ml-auto flex items-center gap-1">
                            <button
                                className="rounded border px-2 disabled:opacity-40"
                                disabled={current === 0}
                                onClick={() => setPage(current - 1)}
                            >
                                前へ
                            </button>
                            <span>
                                {current + 1} / {pages} ページ
                            </span>
                            <button
                                className="rounded border px-2 disabled:opacity-40"
                                disabled={current >= pages - 1}
                                onClick={() => setPage(current + 1)}
                            >
                                次へ
                            </button>
                        </span>
                    )}
                </div>
            )}
            <div className="w-full overflow-x-auto rounded-lg border">
                <table className="w-full caption-bottom text-sm">
                    {caption && (
                        <caption className="text-muted-foreground mt-2 text-xs">{caption}</caption>
                    )}
                    <thead className="bg-muted/50">
                        <tr className="border-b">
                            {shown.map((column) => (
                                <th
                                    key={column.key}
                                    className="text-muted-foreground h-9 px-3 text-left font-medium whitespace-nowrap"
                                >
                                    {column.label}
                                </th>
                            ))}
                            {showSource && (
                                <th className="text-muted-foreground h-9 px-3 text-left font-medium">
                                    ソース
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 && (
                            <tr>
                                <td
                                    colSpan={width || 1}
                                    className="text-muted-foreground px-3 py-6 text-center"
                                >
                                    該当する行はありません
                                </td>
                            </tr>
                        )}
                        {visible.map((row, index) => (
                            <tr key={index} className="hover:bg-muted/40 border-b last:border-0">
                                {shown.map((column) => {
                                    const value = row[column.key];
                                    const short = cellText(value).length <= SHORT_TEXT;
                                    return (
                                        <td
                                            key={column.key}
                                            className={`px-3 py-2 align-top ${short ? 'whitespace-nowrap' : ''}`}
                                        >
                                            {column.key === 'status' && isStatus(value) ? (
                                                <StatusBadge status={value} />
                                            ) : (
                                                cellText(value)
                                            )}
                                        </td>
                                    );
                                })}
                                {showSource && (
                                    <td className="px-3 py-2 align-top">
                                        {isExcerpt(row._source) && (
                                            <SourceSnippet excerpt={row._source} />
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
