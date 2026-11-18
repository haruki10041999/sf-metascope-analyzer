import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { shadcnComponentDefinitions as shadcn } from '@json-render/shadcn/catalog';
import { z } from 'zod';

// レポートのコンポーネントのカタログ (json-render。docs/implementation-roadmap.md 4.1〜4.3)。
// node (仕様の検証・LLM 向けの説明) と viewer (描画) の両方から使う (viewer に重い依存を持ち込まない)。
// レイアウト・文字・バッジ・警告は shadcn/ui の部品の組 (@json-render/shadcn) を使い、解析のデータを描く部品を足す。
// データを受け取る部品は REPORT_DATA_BINDINGS に、受け取るプロパティと、受け取れる出力の形・provider を書く

/** provider の出力の形 (analyzer/report/registry.ts の ProviderShape と同じ) */
export type DataShape = 'rows' | 'matrix' | 'diagram' | 'object';

const bound = (what: string) =>
    z
        .unknown()
        .describe(
            `${what} from a report provider. Never write the data yourself: bind it with { "$state": "/data/<name>" }, where <name> is a key of the document data.`,
        );

/** データの部品が受け取る行 (provider の結果)。AI は行を書かず、{ "$state": "/data/<名前>" } で指す */
const rows = z
    .array(z.record(z.string(), z.unknown()))
    .describe(
        'Rows from a report provider. Never write rows yourself: bind them with { "$state": "/data/<name>" }, where <name> is a key of the document data.',
    );

export const REPORT_COMPONENTS = {
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
    Columns: {
        props: z.object({
            ratio: z
                .array(z.number().positive())
                .min(1)
                .max(6)
                .nullable()
                .describe(
                    'Relative widths of the columns, e.g. [5, 5], [4, 6], [7, 3]. Children fill the columns from the left (more children wrap to the next row). null is two equal columns.',
                ),
            gap: z
                .enum(['sm', 'md', 'lg'])
                .nullable()
                .describe('Space between columns (default md).'),
            stackBelow: z
                .enum(['sm', 'md', 'lg', 'never'])
                .nullable()
                .describe(
                    'Below this screen width the columns stack vertically (sm 640px / md 768px (default) / lg 1024px). never keeps the columns.',
                ),
            align: z
                .enum(['start', 'center', 'stretch'])
                .nullable()
                .describe('Vertical alignment of the columns (default start).'),
        }),
        description:
            'Columns with chosen widths (e.g. 5:5 flowchart and narrative, 4:6 table and notes). Stacks vertically on narrow screens. Grid makes equal columns only.',
    },
    PageLink: {
        props: z.object({
            title: z.string(),
            href: z.string().describe('Relative path of the page (pages/<file>.html).'),
            description: z.string().nullable(),
        }),
        description:
            'Link to another page of the document. The build puts it in place of an element with page; you rarely write it yourself.',
    },
    Narrative: {
        props: z.object({
            markdown: z
                .string()
                .describe(
                    'Text written by the AI (summary, risks, review comments) in Markdown. Raw HTML is not rendered. Do not copy numbers or lists from the data here; bind the data with DataTable / StatusSummary instead.',
                ),
            title: z.string().nullable(),
        }),
        description: 'Markdown text written by the AI (summary, explanation, review comments).',
    },
    DataTable: {
        props: z.object({
            rows,
            columns: z
                .array(z.object({ key: z.string(), label: z.string() }))
                .nullable()
                .describe(
                    'Columns to show (key of the row and its header). null shows every column.',
                ),
            caption: z.string().nullable(),
            onlyChanged: z
                .boolean()
                .nullable()
                .describe(
                    'true hides rows whose status is unchanged (only when comparing; a one-point report shows all).',
                ),
            showSource: z
                .boolean()
                .nullable()
                .exactOptional()
                .describe(
                    'true adds an expandable source excerpt to each row. The data must be declared with withSource: true.',
                ),
        }),
        description:
            'Table of rows from a report provider. The status column (added/removed/changed/unchanged) is shown as a colored badge.',
    },
    StatusSummary: {
        props: z.object({
            rows,
            title: z.string().nullable(),
        }),
        description:
            'Counts of rows by status (added/removed/changed/unchanged) from a report provider, shown as small cards.',
    },
    Matrix: {
        props: z.object({
            data: bound('Matrix (rows x permission holders)'),
            onlyChanged: z
                .boolean()
                .nullable()
                .describe(
                    'true hides rows without any change (only when comparing; a one-point report shows all).',
                ),
        }),
        description:
            'Permission matrix (objects or fields x permission sets / profiles). Changed cells show before -> after.',
    },
    FlowDiagram: {
        props: z.object({
            data: bound('Flow diagrams'),
            flow: z
                .string()
                .nullable()
                .describe('Flow API name to show. null shows every flow in the data.'),
        }),
        description:
            'Diagram of flow elements and connectors. Added / removed / changed elements are colored.',
    },
    ObjectDiagram: {
        props: z.object({
            data: bound('Object ER diagram'),
            showAllFields: z
                .boolean()
                .nullable()
                .describe(
                    'true lists every field in each box. Default (null) shows only relation fields.',
                ),
        }),
        description:
            'Entity relationship diagram of objects (lookup / master-detail), colored by change when comparing.',
    },
    LwcWireframe: {
        props: z.object({
            data: bound('LWC wireframes'),
            component: z
                .string()
                .nullable()
                .describe('Component to show (c/accountList). null shows every root in the data.'),
        }),
        description:
            'Wireframe of Lightning web components from their templates: base components drawn as simple shapes, branches as tabs, loops once with a count mark, child components expandable.',
    },
    CodeFlowchart: {
        props: z.object({
            data: bound('Flowcharts (apex.methodFlow / lwc.methodFlow)'),
            member: z
                .string()
                .nullable()
                .describe(
                    'Show only this member (owner.name) or signature (name(params)). null shows all (with a selector when there are many).',
                ),
            height: z
                .number()
                .int()
                .min(200)
                .max(2000)
                .nullable()
                .describe('Height of the chart in pixels (default: fit to the chart, up to 720).'),
        }),
        description:
            'Flowchart of a method / function from its statements: branches, loops, try / catch, SOQL / DML (colored, marked inside loops), callouts and returns. Click a box to see its source.',
    },
    EventFlow: {
        props: z.object({
            data: bound('Event flow (lwc.eventFlow)'),
            height: z
                .number()
                .int()
                .min(200)
                .max(2000)
                .nullable()
                .describe('Height of the chart in pixels (default: fit to the chart, up to 720).'),
        }),
        description:
            'Flow of LWC from user actions (template events), @wire and lifecycle hooks to handlers, Apex, events, toasts and navigation, across parent and child components (left to right).',
    },
    SequenceDiagram: {
        props: z.object({
            data: bound('Call sequences (apex.callFlow)'),
            start: z
                .string()
                .nullable()
                .describe(
                    'Show only this start member (Owner.method). null shows all (with a selector when there are many).',
                ),
        }),
        description:
            'Sequence diagram of Apex calls from a method: classes as columns, calls, SOQL / DML (to Database), async jobs, callouts and events from top to bottom.',
    },
    DiagramText: {
        props: z.object({
            data: bound('Diagram text (Mermaid or DOT)'),
            title: z.string().nullable(),
        }),
        description: 'Source text of a dependency diagram (Mermaid or DOT), shown as a code block.',
    },
    LayoutView: {
        props: z.object({ data: bound('Page layouts') }),
        description:
            'Page layouts: sections and fields (with moves), related lists and actions, colored by change.',
    },
    FlexiPageView: {
        props: z.object({ data: bound('Lightning pages') }),
        description: 'Lightning pages: regions and their components / fields, colored by change.',
    },
    AutomationView: {
        props: z.object({ data: bound('Automation by object') }),
        description:
            'Automation of each object: record-triggered flows (with order), Apex triggers, validation rules.',
    },
    ImpactView: {
        props: z.object({ data: bound('Change impact') }),
        description:
            'Changed units and the units impacted by them (following dependents), as two tables.',
    },
};

export type ReportComponentName = keyof typeof REPORT_COMPONENTS;

/**
 * データを受け取る部品の、受け取るプロパティと、受け取れるデータ。
 * shapes: 出力の形で受け取れるもの / providers: 形が同じでも中身の違うもの (object・diagram) は provider の名前で決める
 */
export type DataBinding = { prop: string; shapes?: DataShape[]; providers?: string[] };

export const REPORT_DATA_BINDINGS: Partial<Record<ReportComponentName, DataBinding>> = {
    DataTable: { prop: 'rows', shapes: ['rows'] },
    StatusSummary: { prop: 'rows', shapes: ['rows'] },
    Matrix: { prop: 'data', shapes: ['matrix'] },
    FlowDiagram: { prop: 'data', providers: ['flow.diagram'] },
    ObjectDiagram: { prop: 'data', providers: ['object.diagram'] },
    LwcWireframe: { prop: 'data', providers: ['lwc.wireframe'] },
    CodeFlowchart: { prop: 'data', providers: ['apex.methodFlow', 'lwc.methodFlow'] },
    EventFlow: { prop: 'data', providers: ['lwc.eventFlow'] },
    SequenceDiagram: { prop: 'data', providers: ['apex.callFlow'] },
    DiagramText: { prop: 'data', providers: ['dependency.graph'] },
    LayoutView: { prop: 'data', providers: ['layout.detail'] },
    FlexiPageView: { prop: 'data', providers: ['flexiPage.detail'] },
    AutomationView: { prop: 'data', providers: ['automation.byObject'] },
    ImpactView: { prop: 'data', providers: ['dependency.impact'] },
};

/** 部品がその provider (と出力の形) のデータを受け取れるか */
export const acceptsData = (binding: DataBinding, provider: string, shape: DataShape): boolean =>
    (binding.shapes?.includes(shape) ?? false) || (binding.providers?.includes(provider) ?? false);

export const reportCatalog = defineCatalog(schema, {
    components: REPORT_COMPONENTS,
    actions: {},
});
