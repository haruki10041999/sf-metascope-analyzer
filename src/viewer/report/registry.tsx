import { type Components, defineRegistry } from '@json-render/react';
import { shadcnComponents as shadcn } from '@json-render/shadcn';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type {
    AutomationRow,
    CallSequence,
    CodeFlow,
    EventFlow,
    DependencyNodeRow,
    FlexiPageDetail,
    FlowDiagram,
    LayoutDetail,
    LwcWireframe,
    Matrix,
    ObjectDiagram,
} from '../../analyzer/report/types';
import { REPORT_DATA_BINDINGS, reportCatalog } from '../../report/catalog';
import { COMPARED_PROP } from '../../report/embedding';

import {
    AutomationView,
    DiagramTextView,
    FlexiPageView,
    ImpactView,
    LayoutView,
} from './components/details';
import { CodeFlowchartView } from './components/codeFlowchart';
import { EventFlowView } from './components/eventFlow';
import { FlowDiagramView } from './components/flowDiagram';
import { LwcWireframeView } from './components/lwcWireframe';
import { MatrixView } from './components/matrix';
import { ObjectDiagramView } from './components/objectDiagram';
import { type Row, RowsTable } from './components/rowsTable';
import { SequenceDiagramView } from './components/sequenceDiagram';
import { STATUSES, StatusBadge } from './components/status';

// レポートの部品の実装 (カタログ: src/report/catalog.ts)。
// shadcn/ui の部品の組をそのまま使い、解析のデータを描く部品 (components/) を足す。
// 色は styles.css のテーマの変数だけを使う (status の色は components/status.tsx)

/** Columns の列の間 (Tailwind が拾えるように、クラスは固定の文字列で書く) */
const COLUMN_GAPS = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' } as const;
/** この幅より狭い画面では縦に積む (列の幅は CSS の変数 --columns) */
const COLUMN_BREAKPOINTS = {
    sm: 'sm:[grid-template-columns:var(--columns)]',
    md: 'md:[grid-template-columns:var(--columns)]',
    lg: 'lg:[grid-template-columns:var(--columns)]',
    never: '[grid-template-columns:var(--columns)]',
} as const;
const COLUMN_ALIGNS = {
    start: 'items-start',
    center: 'items-center',
    stretch: 'items-stretch',
} as const;

const components: Components<typeof reportCatalog> = {
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
    Columns: ({ props, children }) => {
        const ratio = props.ratio?.length ? props.ratio : [1, 1];
        // minmax(0, …) で、幅の広い表・図があっても列の比を保つ (中で横に動かす)
        const columns = ratio.map((part) => `minmax(0, ${part}fr)`).join(' ');
        return (
            <div
                className={[
                    'grid grid-cols-1 [&>*]:min-w-0',
                    COLUMN_GAPS[props.gap ?? 'md'],
                    COLUMN_BREAKPOINTS[props.stackBelow ?? 'md'],
                    COLUMN_ALIGNS[props.align ?? 'start'],
                ].join(' ')}
                style={{ '--columns': columns } as React.CSSProperties}
            >
                {children}
            </div>
        );
    },
    PageLink: ({ props }) => (
        <a
            href={props.href}
            className="bg-card hover:bg-muted/50 flex flex-col gap-0.5 rounded-lg border px-4 py-3 transition-colors"
        >
            <span className="text-sm font-medium underline-offset-2 hover:underline">
                {props.title}
            </span>
            {props.description && (
                <span className="text-muted-foreground text-xs">{props.description}</span>
            )}
        </a>
    ),
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
                            <div className="mt-1 text-2xl font-semibold tabular-nums">{count}</div>
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
    CodeFlowchart: ({ props }) => (
        <CodeFlowchartView
            data={props.data as CodeFlow[] | undefined}
            member={props.member}
            height={props.height}
        />
    ),
    EventFlow: ({ props }) => (
        <EventFlowView data={props.data as EventFlow | undefined} height={props.height} />
    ),
    SequenceDiagram: ({ props }) => (
        <SequenceDiagramView data={props.data as CallSequence[] | undefined} start={props.start} />
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
};

/** データが自分の比べ方 (diff・compare) を持つとき、部品の上に「比べた時点」を出す (ビルドが足す props の _compared) */
type AnyComponent = (ctx: { props: Record<string, unknown> }) => React.ReactNode;

for (const name of Object.keys(REPORT_DATA_BINDINGS)) {
    const map = components as unknown as Record<string, AnyComponent>;
    const Inner = map[name]!;
    map[name] = (ctx) => {
        const compared = ctx.props[COMPARED_PROP];
        return typeof compared === 'string' ? (
            <div className="flex flex-col gap-1">
                <p className="text-muted-foreground text-xs">{`比べた時点: ${compared}`}</p>
                <Inner {...ctx} />
            </div>
        ) : (
            <Inner {...ctx} />
        );
    };
}

export const { registry } = defineRegistry(reportCatalog, { components });
