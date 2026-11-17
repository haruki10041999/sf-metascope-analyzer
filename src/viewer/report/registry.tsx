import { defineRegistry } from '@json-render/react';
import { shadcnComponents as shadcn } from '@json-render/shadcn';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type {
    AutomationRow,
    DependencyNodeRow,
    FlexiPageDetail,
    FlowDiagram,
    LayoutDetail,
    LwcWireframe,
    Matrix,
    ObjectDiagram,
} from '../../analyzer/report/types';
import { reportCatalog } from '../../report/catalog';

import {
    AutomationView,
    DiagramTextView,
    FlexiPageView,
    ImpactView,
    LayoutView,
} from './components/details';
import { FlowDiagramView } from './components/flowDiagram';
import { LwcWireframeView } from './components/lwcWireframe';
import { MatrixView } from './components/matrix';
import { ObjectDiagramView } from './components/objectDiagram';
import { type Row, RowsTable } from './components/rowsTable';
import { STATUSES, StatusBadge } from './components/status';

// レポートの部品の実装 (カタログ: src/report/catalog.ts)。
// shadcn/ui の部品の組をそのまま使い、解析のデータを描く部品 (components/) を足す。
// 色は styles.css のテーマの変数だけを使う (status の色は components/status.tsx)

export const { registry } = defineRegistry(reportCatalog, {
    components: {
        Card: shadcn.Card,
        Stack: shadcn.Stack,
        Grid: shadcn.Grid,
        Separator: shadcn.Separator,
        Tabs: shadcn.Tabs,
        Accordion: shadcn.Accordion,
        Heading: shadcn.Heading,
        Text: shadcn.Text,
        Badge: shadcn.Badge,
        Alert: shadcn.Alert,
        Narrative: ({ props }) => (
            <section className="flex flex-col gap-2">
                {props.title && <h2 className="text-lg font-semibold">{props.title}</h2>}
                {/* 生の HTML は描かない (react-markdown の既定)。見出し・箇条書き・表・強調だけを整える */}
                <div className="text-sm leading-relaxed [&_a]:underline [&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_table]:my-2 [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:bg-muted/50 [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_ul]:pl-6">
                    <Markdown remarkPlugins={[remarkGfm]}>{props.markdown}</Markdown>
                </div>
            </section>
        ),
        DataTable: ({ props }) => {
            const all = (props.rows ?? []) as Row[];
            // onlyChanged は比べたデータ (status がある) だけに効く。1 時点のデータなら、すべてを出す
            const compared = all.some((row) => row.status !== undefined);
            const rows =
                props.onlyChanged && compared
                    ? all.filter((row) => row.status !== undefined && row.status !== 'unchanged')
                    : all;
            return (
                <RowsTable
                    rows={rows}
                    columns={props.columns}
                    caption={props.caption}
                    showSource={props.showSource}
                />
            );
        },
        StatusSummary: ({ props }) => {
            const rows = (props.rows ?? []) as Row[];
            const counts = STATUSES.map(
                (status) => [status, rows.filter((row) => row.status === status).length] as const,
            );
            return (
                <div className="flex flex-col gap-2">
                    {props.title && <div className="text-sm font-medium">{props.title}</div>}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {counts.map(([status, count]) => (
                            <div key={status} className="bg-card rounded-lg border p-3">
                                <StatusBadge status={status} />
                                <div className="mt-1 text-2xl font-semibold tabular-nums">
                                    {count}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        },
        Matrix: ({ props }) => (
            <MatrixView
                data={props.data as Matrix<unknown> | undefined}
                onlyChanged={props.onlyChanged}
            />
        ),
        FlowDiagram: ({ props }) => (
            <FlowDiagramView data={props.data as FlowDiagram[] | undefined} flow={props.flow} />
        ),
        ObjectDiagram: ({ props }) => (
            <ObjectDiagramView
                data={props.data as ObjectDiagram | undefined}
                showAllFields={props.showAllFields}
            />
        ),
        LwcWireframe: ({ props }) => (
            <LwcWireframeView
                data={props.data as LwcWireframe | undefined}
                component={props.component}
            />
        ),
        DiagramText: ({ props }) => (
            <DiagramTextView
                data={props.data as { format: string; text: string } | undefined}
                title={props.title}
            />
        ),
        LayoutView: ({ props }) => <LayoutView data={props.data as LayoutDetail[] | undefined} />,
        FlexiPageView: ({ props }) => (
            <FlexiPageView data={props.data as FlexiPageDetail[] | undefined} />
        ),
        AutomationView: ({ props }) => (
            <AutomationView data={props.data as AutomationRow[] | undefined} />
        ),
        ImpactView: ({ props }) => (
            <ImpactView
                data={
                    props.data as
                        { changed: DependencyNodeRow[]; impacted: DependencyNodeRow[] } | undefined
                }
            />
        ),
    },
});
