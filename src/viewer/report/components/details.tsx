import type {
    AutomationRow,
    DependencyNodeRow,
    FlexiPageDetail,
    LayoutDetail,
} from '../../../analyzer/report/types';

import { type Row, RowsTable } from './rowsTable';
import { STATUS_BOX_CLASSES, StatusBadge, statusOf } from './status';

// オブジェクトの形のデータの部品 (layout.detail・flexiPage.detail・automation.byObject・dependency.impact・dependency.graph)

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">{title}</div>
        {children}
    </div>
);

const Title = ({
    name,
    status,
    sub,
}: {
    name: string;
    status?: unknown;
    sub?: string | undefined;
}) => (
    <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold">{name}</h3>
        {sub && <span className="text-muted-foreground text-sm">{sub}</span>}
        <StatusBadge status={statusOf({ status })} />
    </div>
);

const Empty = ({ what }: { what: string }) => (
    <p className="text-muted-foreground text-sm">{what}がありません</p>
);

/** ページレイアウト: セクションの格子 (列ごとに項目を並べる)・関連リスト・アクション */
export const LayoutView = ({ data }: { data: LayoutDetail[] | undefined }) => {
    if (!data?.length) return <Empty what="レイアウト" />;
    return (
        <div className="flex flex-col gap-8">
            {data.map((layout) => (
                <div key={layout.name} className="flex flex-col gap-4">
                    <Title name={layout.name} status={layout.status} sub={layout.objectApiName} />
                    {layout.sections.map((section, index) => (
                        <div
                            key={index}
                            className={`rounded-lg border p-3 ${STATUS_BOX_CLASSES[statusOf(section)]}`}
                        >
                            <div className="mb-2 text-sm font-medium">
                                {section.label || '(見出しなし)'}
                            </div>
                            <div
                                className="grid gap-2"
                                style={{
                                    gridTemplateColumns: `repeat(${Math.max(section.columns, 1)}, minmax(0, 1fr))`,
                                }}
                            >
                                {Array.from(
                                    { length: Math.max(section.columns, 1) },
                                    (_, column) => (
                                        <div key={column} className="flex flex-col gap-1">
                                            {section.items
                                                .filter(
                                                    (item) =>
                                                        item.column === column + 1 ||
                                                        (section.columns <= 1 && column === 0),
                                                )
                                                .sort((a, b) => a.row - b.row)
                                                .map((item, i) => (
                                                    <div
                                                        key={i}
                                                        className={`rounded border px-2 py-1 text-xs ${STATUS_BOX_CLASSES[statusOf(item)]}`}
                                                        title={
                                                            item.movedFrom
                                                                ? `移動: ${item.movedFrom.section} の ${item.movedFrom.column} 列 ${item.movedFrom.row} 行から`
                                                                : undefined
                                                        }
                                                    >
                                                        {item.field ?? item.other ?? '(空白)'}
                                                        {item.behavior &&
                                                            item.behavior !== 'Edit' && (
                                                                <span className="text-muted-foreground">
                                                                    {' '}
                                                                    ({item.behavior})
                                                                </span>
                                                            )}
                                                        {item.movedFrom && (
                                                            <span className="text-muted-foreground">
                                                                {' '}
                                                                ↪
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    ))}
                    {layout.relatedLists.length > 0 && (
                        <Section title="関連リスト">
                            <RowsTable
                                rows={layout.relatedLists as Row[]}
                                columns={[
                                    { key: 'status', label: '変化' },
                                    { key: 'relatedList', label: '関連リスト' },
                                    { key: 'fields', label: '項目' },
                                ]}
                            />
                        </Section>
                    )}
                    {layout.actions.length > 0 && (
                        <Section title="アクション">
                            <RowsTable
                                rows={layout.actions as Row[]}
                                columns={[
                                    { key: 'status', label: '変化' },
                                    { key: 'actionName', label: 'アクション' },
                                    { key: 'actionType', label: '種類' },
                                ]}
                            />
                        </Section>
                    )}
                </div>
            ))}
        </div>
    );
};

/** Lightning ページ: リージョンごとの部品・項目 */
export const FlexiPageView = ({ data }: { data: FlexiPageDetail[] | undefined }) => {
    if (!data?.length) return <Empty what="Lightning ページ" />;
    return (
        <div className="flex flex-col gap-8">
            {data.map((page) => (
                <div key={page.name} className="flex flex-col gap-3">
                    <Title
                        name={page.label ?? page.name}
                        status={page.status}
                        sub={[page.pageType, page.sobjectType].filter(Boolean).join('・')}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                        {page.regions.map((region) => (
                            <div
                                key={region.name}
                                className={`rounded-lg border p-3 ${STATUS_BOX_CLASSES[statusOf(region)]}`}
                            >
                                <div className="mb-2 text-sm font-medium">{region.name}</div>
                                <div className="flex flex-col gap-1">
                                    {region.items.map((item) => (
                                        <div
                                            key={item.identifier}
                                            className={`rounded border px-2 py-1 text-xs ${STATUS_BOX_CLASSES[statusOf(item)]}`}
                                        >
                                            <span className="font-medium">{item.name}</span>
                                            <span className="text-muted-foreground">
                                                {' '}
                                                ({item.itemType === 'field' ? '項目' : '部品'}
                                                {item.hasVisibilityRule ? '・表示条件あり' : ''}
                                                {item.movedFrom
                                                    ? `・${item.movedFrom} から移動`
                                                    : ''}
                                                )
                                            </span>
                                        </div>
                                    ))}
                                    {region.items.length === 0 && (
                                        <span className="text-muted-foreground text-xs">(空)</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

/** オブジェクトごとの自動化 (レコードトリガーフロー・Apex トリガー・入力規則) */
export const AutomationView = ({ data }: { data: AutomationRow[] | undefined }) => {
    if (!data?.length) return <Empty what="自動化" />;
    return (
        <div className="flex flex-col gap-6">
            {data.map((automation) => (
                <div key={automation.object} className="flex flex-col gap-3">
                    <h3 className="text-base font-semibold">{automation.object}</h3>
                    {automation.flows.length > 0 && (
                        <Section title="レコードトリガーフロー">
                            <RowsTable
                                rows={automation.flows as Row[]}
                                columns={[
                                    { key: 'status', label: '変化' },
                                    { key: 'triggerOrder', label: '順序' },
                                    { key: 'name', label: 'Flow' },
                                    { key: 'triggerType', label: '起動' },
                                    { key: 'recordTriggerType', label: 'レコード' },
                                ]}
                            />
                        </Section>
                    )}
                    {automation.triggers.length > 0 && (
                        <Section title="Apex トリガー">
                            <RowsTable
                                rows={automation.triggers as Row[]}
                                columns={[
                                    { key: 'status', label: '変化' },
                                    { key: 'name', label: 'トリガー' },
                                    { key: 'events', label: 'イベント' },
                                    { key: 'triggerStatus', label: '状態' },
                                ]}
                            />
                        </Section>
                    )}
                    {automation.validationRules.length > 0 && (
                        <Section title="入力規則">
                            <RowsTable
                                rows={automation.validationRules as Row[]}
                                columns={[
                                    { key: 'status', label: '変化' },
                                    { key: 'name', label: '入力規則' },
                                    { key: 'active', label: '有効' },
                                    { key: 'errorMessage', label: 'エラーメッセージ' },
                                ]}
                            />
                        </Section>
                    )}
                </div>
            ))}
        </div>
    );
};

const NODE_COLUMNS = [
    { key: 'status', label: '変化' },
    { key: 'depth', label: '段' },
    { key: 'type', label: '種類' },
    { key: 'name', label: '名前' },
    { key: 'id', label: 'id' },
];

/** 変更の影響: 変わった単位と、影響を受ける単位 */
export const ImpactView = ({
    data,
}: {
    data: { changed: DependencyNodeRow[]; impacted: DependencyNodeRow[] } | undefined;
}) => {
    if (!data) return null;
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Section title={`変わった単位 (${data.changed.length})`}>
                <RowsTable
                    rows={data.changed as Row[]}
                    columns={NODE_COLUMNS.filter((c) => c.key !== 'depth')}
                />
            </Section>
            <Section title={`影響を受ける単位 (${data.impacted.length})`}>
                <RowsTable
                    rows={data.impacted as Row[]}
                    columns={NODE_COLUMNS.filter((c) => c.key !== 'status')}
                />
            </Section>
        </div>
    );
};

/** 依存関係の図の文字列 (Mermaid・DOT) */
export const DiagramTextView = ({
    data,
    title,
}: {
    data: { format: string; text: string } | undefined;
    title?: string | null | undefined;
}) => {
    if (!data) return null;
    return (
        <Section title={title ?? `依存関係の図 (${data.format})`}>
            <pre className="bg-muted max-h-[480px] overflow-auto rounded-lg p-3 font-mono text-xs leading-snug">
                {data.text}
            </pre>
        </Section>
    );
};
