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
