// 差分の status の名前と色 (色は styles.css のテーマの変数 --status-* だけを使う)

export const STATUSES = ['added', 'removed', 'changed', 'unchanged'] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
    added: '追加',
    removed: '削除',
    changed: '変更',
    unchanged: '変更なし',
};

/** バッジの色 */
export const STATUS_CLASSES: Record<Status, string> = {
    added: 'bg-status-added/15 text-status-added border-status-added/40',
    removed: 'bg-status-removed/15 text-status-removed border-status-removed/40',
    changed: 'bg-status-changed/15 text-status-changed border-status-changed/40',
    unchanged: 'bg-muted text-muted-foreground border-border',
};

/** 枠・背景の色 (図のノード・行列のセル・レイアウトの項目) */
export const STATUS_BOX_CLASSES: Record<Status, string> = {
    added: 'border-status-added bg-status-added/10',
    removed: 'border-status-removed bg-status-removed/10',
    changed: 'border-status-changed bg-status-changed/10',
    unchanged: 'border-border bg-card',
};

/** 図の線の色 (CSS の変数) */
export const STATUS_STROKES: Record<Status, string> = {
    added: 'var(--status-added)',
    removed: 'var(--status-removed)',
    changed: 'var(--status-changed)',
    unchanged: 'var(--ring)',
};

export const isStatus = (value: unknown): value is Status =>
    typeof value === 'string' && (STATUSES as readonly string[]).includes(value);

/** status (なければ unchanged) */
export const statusOf = (value: { status?: unknown } | undefined): Status =>
    isStatus(value?.status) ? value.status : 'unchanged';

/** status のバッジ */
export const StatusBadge = ({ status }: { status: Status }) => (
    <span
        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_CLASSES[status]}`}
    >
        {STATUS_LABELS[status]}
    </span>
);
