// 表の行のデータの扱い (画面に依存しない部分)。viewer の表 (viewer/report/components/rowsTable.tsx) と、
// 表の書き出し (CSV) で共通に使う。行の形は provider ごとに違うので、値は unknown のまま扱う

export type Row = Record<string, unknown>;
export type Column = { key: string; label: string };

/**
 * 列を指定しないときに出さない列 (位置・ソースの抜き出し・ファイルのパス)。
 * ファイルのパスは長く読みにくいので、要るときは列を指定する
 */
const HIDDEN_COLUMNS = new Set(['sourceKeys', '_source', 'filePath']);

/** 行のキーから列を作る (出てきた順。status を先頭にする) */
export const tableColumnsOf = (rows: readonly Row[]): Column[] => {
    const keys = new Set<string>();
    for (const row of rows) for (const key of Object.keys(row)) keys.add(key);
    return [...keys]
        .filter((key) => !HIDDEN_COLUMNS.has(key))
        .sort((a, b) => (a === 'status' ? -1 : b === 'status' ? 1 : 0))
        .map((key) => ({ key, label: key }));
};

/** 並べ替えの状態 (どの列を、どちらの向きで) */
export type SortState = { key: string; direction: 'asc' | 'desc' } | null;

/** セルの値の文字 (真偽値ははい・いいえ、配列は , でつなぐ、名前を持つオブジェクトは名前) */
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

/** 空の値 (並べ替えではどちらの向きでも最後にする) */
const isEmpty = (value: unknown) =>
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && !value.length);

/** 2 つの値を、昇順の並べ替えの順で比べる (数は数で、ほかは表に出す文字で。空は最後) */
export const compareCells = (a: unknown, b: unknown): number => {
    if (isEmpty(a) || isEmpty(b)) return isEmpty(a) === isEmpty(b) ? 0 : isEmpty(a) ? 1 : -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return cellText(a).localeCompare(cellText(b), 'ja', { numeric: true });
};

/** 並べ替えた行 (sort がなければ元の順のまま。同じ値は元の順を保つ) */
export const sortRows = (rows: readonly Row[], sort: SortState): Row[] => {
    if (!sort) return [...rows];
    const sign = sort.direction === 'asc' ? 1 : -1;
    return rows
        .map((row, index) => ({ row, index }))
        .sort((x, y) => {
            const a = x.row[sort.key];
            const b = y.row[sort.key];
            // 空はどちらの向きでも最後
            if (isEmpty(a) !== isEmpty(b)) return isEmpty(a) ? 1 : -1;
            return sign * compareCells(a, b) || x.index - y.index;
        })
        .map(({ row }) => row);
};

/** 見出しを押したときの次の並べ替え (昇順 → 降順 → 並べ替えなし) */
export const nextSort = (current: SortState, key: string): SortState => {
    if (!current || current.key !== key) return { key, direction: 'asc' };
    return current.direction === 'asc' ? { key, direction: 'desc' } : null;
};

/** CSV の先頭に付ける BOM (Excel が UTF-8 と分かるように) */
const BOM = String.fromCharCode(0xfeff);

/** CSV の 1 つの値 (", 改行を含めば " で囲み、" は "" にする。RFC 4180) */
const csvValue = (text: string) => (/[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);

/**
 * 行を CSV にする (見出しの行は列のラベル)。値は表に出す文字と同じ (cellText)。
 * Excel で開いても文字化けしないよう、先頭に BOM を付ける
 */
export const tableToCsv = (rows: readonly Row[], columns: readonly Column[]): string =>
    BOM +
    [
        columns.map((column) => csvValue(column.label)).join(','),
        ...rows.map((row) =>
            columns.map((column) => csvValue(cellText(row[column.key]))).join(','),
        ),
    ].join('\r\n') +
    '\r\n';
