export type SortDirection = 'asc' | 'desc';

export interface Row {
    id: string;
    name: string;
    amount?: number;
}

const formatter = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' });

export const formatAmount = (value: number): string => formatter.format(value);

export function toRows(records: unknown[]): Row[] {
    return records.map((record) => record as Row);
}
