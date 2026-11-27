import { useState } from 'react';

import {
    type Column,
    type Row,
    type SortState,
    cellText,
    nextSort,
    sortRows,
    tableColumnsOf,
    tableToCsv,
} from '../../../report/tableData';
import { StatusBadge, isStatus } from './status';

// 行の並びの表 (DataTable と、ほかの部品の中の表で共通)。
// 見出しを押すと並べ替え (昇順 → 降順 → 元の順)、「列」で出す列を選び、「CSV」で今見えている行を書き出す

export type { Column, Row };
export { cellText };

/** 折り返さない短い値 (はい・いいえ・数・短い名前) */
const SHORT_TEXT = 12;

/** 1 ページの行の数 (大きい組織では数万行になるので、一度に描かない) */
const PAGE_SIZE = 200;
/** これより行が多ければ、絞り込みの入力欄を出す */
const FILTER_FROM = 20;

/** 行のキーから列を作る (共通の tableColumnsOf) */
export const columnsOf = (rows: Row[]): Column[] => tableColumnsOf(rows);

/** 1 行ずつ出す文字列の配列 (中身の一覧 details など。3 件以上なら , でつながず改行する) */
const isLineList = (value: unknown): value is string[] =>
    Array.isArray(value) && value.length >= 3 && value.every((item) => typeof item === 'string');

/** CSV を書き出す (ブラウザのダウンロード) */
const downloadCsv = (fileName: string, rows: readonly Row[], columns: readonly Column[]) => {
    const blob = new Blob([tableToCsv(rows, columns)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
};

/** 書き出すファイルの名前 (表の説明から。使えない文字は _ にする) */
const csvFileName = (caption: string | null | undefined) =>
    `${(caption ?? 'table').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 60) || 'table'}.csv`;

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
    const all = columns ?? columnsOf(rows);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [sort, setSort] = useState<SortState>(null);
    const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
    // 列の出し分け: 隠した列は出さない (すべてを隠すことはできない)
    const shown = all.filter((column) => !hidden.has(column.key));
    const width = shown.length + (showSource ? 1 : 0);
    // 絞り込み: 表に出している列のどれかに、入力した文字列を含む行 (大文字・小文字を区別しない)
    const needle = query.trim().toLowerCase();
    const filtered = sortRows(
        needle
            ? rows.filter((row) =>
                  shown.some((column) => cellText(row[column.key]).toLowerCase().includes(needle)),
              )
            : rows,
        sort,
    );
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pages - 1);
    const visible = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
    const toggleColumn = (key: string) =>
        setHidden((before) => {
            const next = new Set(before);
            if (next.has(key)) next.delete(key);
            else if (all.length - next.size > 1) next.add(key);
            return next;
        });
    return (
        <div className="flex w-full flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
                {rows.length > FILTER_FROM && (
                    <>
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
                            {needle
                                ? `${filtered.length} / ${rows.length} 行`
                                : `${rows.length} 行`}
                        </span>
                    </>
                )}
                {all.length > 1 && (
                    <details className="relative">
                        <summary className="cursor-pointer rounded border px-2 py-0.5 select-none">
                            列{hidden.size ? ` (${shown.length} / ${all.length})` : ''}
                        </summary>
                        <div className="bg-background absolute z-10 mt-1 flex max-h-72 min-w-48 flex-col gap-1 overflow-auto rounded border p-2 shadow">
                            {all.map((column) => (
                                <label key={column.key} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={!hidden.has(column.key)}
                                        onChange={() => toggleColumn(column.key)}
                                    />
                                    {column.label}
                                </label>
                            ))}
                        </div>
                    </details>
                )}
                {rows.length > 0 && (
                    <button
                        className="rounded border px-2 py-0.5"
                        title="絞り込み・並べ替えのあとの行 (すべてのページ) と、出している列を書き出す"
                        onClick={() => downloadCsv(csvFileName(caption), filtered, shown)}
                    >
                        CSV
                    </button>
                )}
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
            <div className="w-full overflow-x-auto rounded-lg border">
                <table className="w-full caption-bottom text-sm">
                    {caption && (
                        <caption className="text-muted-foreground mt-2 text-xs">{caption}</caption>
                    )}
                    <thead className="bg-muted/50">
                        <tr className="border-b">
                            {shown.map((column) => {
                                const sorted = sort?.key === column.key ? sort.direction : null;
                                return (
                                    <th
                                        key={column.key}
                                        aria-sort={
                                            sorted === 'asc'
                                                ? 'ascending'
                                                : sorted === 'desc'
                                                  ? 'descending'
                                                  : 'none'
                                        }
                                        className="text-muted-foreground h-9 px-3 text-left font-medium whitespace-nowrap"
                                    >
                                        <button
                                            type="button"
                                            className="hover:text-foreground flex items-center gap-1"
                                            title="押すと並べ替え (昇順 → 降順 → 元の順)"
                                            onClick={() => {
                                                setSort(nextSort(sort, column.key));
                                                setPage(0);
                                            }}
                                        >
                                            {column.label}
                                            <span aria-hidden className="w-3 text-xs">
                                                {sorted === 'asc'
                                                    ? '▲'
                                                    : sorted === 'desc'
                                                      ? '▼'
                                                      : ''}
                                            </span>
                                        </button>
                                    </th>
                                );
                            })}
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
                                            ) : isLineList(value) ? (
                                                <ul className="space-y-0.5 text-xs">
                                                    {value.map((line, i) => (
                                                        <li key={i} className="break-all">
                                                            {line}
                                                        </li>
                                                    ))}
                                                </ul>
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
