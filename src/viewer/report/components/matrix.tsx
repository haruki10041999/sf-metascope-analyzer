import type { Matrix as MatrixData, MatrixCell } from '../../../analyzer/report/types';

import { STATUS_BOX_CLASSES, statusOf } from './status';

// 権限の行列 (permission.objectAccess・permission.fieldAccess)。
// セルの値は、権限の真偽値の組を文字 (CRED など) にして見せる。変わったセルは「前 → 後」

/** 権限の名前 → 文字 (オブジェクト: CRED・V(すべて表示)・M(すべて変更)・F(すべての項目)、項目: R・E) */
const FLAG_LETTERS: [key: string, letter: string][] = [
    ['allowCreate', 'C'],
    ['allowRead', 'R'],
    ['allowEdit', 'E'],
    ['allowDelete', 'D'],
    ['viewAllRecords', 'V'],
    ['modifyAllRecords', 'M'],
    ['viewAllFields', 'F'],
    ['readable', 'R'],
    ['editable', 'E'],
];

const flagsText = (value: unknown): string => {
    if (value === undefined || value === null) return '—';
    if (typeof value !== 'object') return String(value);
    const flags = value as Record<string, unknown>;
    const letters = FLAG_LETTERS.filter(([key]) => flags[key] === true).map(([, l]) => l);
    return letters.join('') || '—';
};

const cellText = (cell: MatrixCell<unknown>) => {
    const before = flagsText(cell.before);
    const after = flagsText(cell.after);
    // 削除されたセルは削除前の値、変わったセルは「前 → 後」
    if (cell.status === 'removed') return before;
    return cell.status === 'changed' && before !== after ? `${before} → ${after}` : after;
};

export const MatrixView = ({
    data,
    onlyChanged,
}: {
    data: MatrixData<unknown> | undefined;
    onlyChanged?: boolean | null | undefined;
}) => {
    if (!data) return null;
    // onlyChanged は比べたデータ (status がある) だけに効く。1 時点のデータなら、すべてを出す
    const compared = data.rows.some((row) =>
        Object.values(data.cells[row] ?? {}).some((cell) => cell.status !== undefined),
    );
    const rows = data.rows.filter(
        (row) =>
            !onlyChanged ||
            !compared ||
            Object.values(data.cells[row] ?? {}).some(
                (cell) => cell.status !== undefined && cell.status !== 'unchanged',
            ),
    );
    return (
        <div className="w-full overflow-x-auto rounded-lg border">
            <table className="text-sm">
                <thead className="bg-muted/50">
                    <tr className="border-b">
                        <th className="text-muted-foreground h-9 px-3 text-left font-medium" />
                        {data.columns.map((column) => (
                            <th
                                key={`${column.type}:${column.name}`}
                                className="text-muted-foreground h-9 px-3 text-left font-medium whitespace-nowrap"
                            >
                                {column.name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 && (
                        <tr>
                            <td
                                colSpan={data.columns.length + 1}
                                className="text-muted-foreground px-3 py-6 text-center"
                            >
                                該当する行はありません
                            </td>
                        </tr>
                    )}
                    {rows.map((row) => (
                        <tr key={row} className="border-b last:border-0">
                            <th className="px-3 py-1.5 text-left font-medium whitespace-nowrap">
                                {row}
                            </th>
                            {data.columns.map((column) => {
                                // セルは列の「種類:名前」で引く (permission.ts の refKey)
                                const key = `${column.type}:${column.name}`;
                                const cell = data.cells[row]?.[key];
                                return (
                                    <td key={key} className="px-1 py-1">
                                        {cell && (
                                            <div
                                                className={`rounded border px-2 py-0.5 text-center font-mono text-xs ${STATUS_BOX_CLASSES[statusOf(cell)]}`}
                                            >
                                                {cellText(cell)}
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="text-muted-foreground px-3 py-2 text-xs">
                C: 作成 R: 参照 E: 編集 D: 削除 V: すべて表示 M: すべて変更 F: すべての項目
            </p>
        </div>
    );
};
