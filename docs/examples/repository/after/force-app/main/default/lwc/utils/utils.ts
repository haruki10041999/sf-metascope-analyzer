export type SortDirection = 'asc' | 'desc' | 'none';

export interface Row {
    id: string;
    name: string;
    amount?: number;
    industry?: string;
}

export enum ViewKind {
    Table,
    Tile,
}

const formatter = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' });

export const formatAmount = (value: number): string => formatter.format(value);

export function toRows(records: unknown[], limit: number = 50): Row[] {
    return records.slice(0, limit).map((record) => record as Row);
}

/** 行のキャッシュ (コンポーネント以外のクラス。メンバーはコンポーネントと同じ形で JSON に入る) */
export class RowCache {
    static instances = 0;

    #rows = new Map<string, Row>();

    get size(): number {
        return this.#rows.size;
    }

    put(rows: Row[]): number {
        let count = 0;
        for (const row of rows) {
            if (!row.id) continue;
            switch (row.name) {
                case '':
                    break;
                default:
                    this.#rows.set(row.id, row);
                    count++;
            }
        }
        return count;
    }
}

export { formatAmount as format };
