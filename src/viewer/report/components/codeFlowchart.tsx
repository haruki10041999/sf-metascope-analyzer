import { Background, Controls, type Edge, MarkerType, type Node, ReactFlow } from '@xyflow/react';
import { useState } from 'react';

import type { CodeFlow, CodeFlowEdge, CodeFlowNode } from '../../../analyzer/report/types';
import { getLayoutedElements } from '../../autoNodeLayout';

// 処理フロー (apex.methodFlow)。上から下に並べ (dagre)、箱の種類で色を変える (styles.css の --flow-*)。
// 箱を押すと、元のソース (行番号つき) を下に出す

const NODE_WIDTH = 260;
const LINE_HEIGHT = 16;
/** 1 行に入る文字の目安 (半角。全角は 2 と数える)。折り返しを見込んで箱の高さを決める */
const LINE_WIDTH = 38;

/** 折り返したときの行数 */
const wrappedLines = (text: string) =>
    text.split('\n').reduce((sum, line) => {
        const width = [...line].reduce((w, ch) => w + (ch.charCodeAt(0) > 0xff ? 2 : 1), 0);
        return sum + Math.max(1, Math.ceil(width / LINE_WIDTH));
    }, 0);

type Kind = CodeFlowNode['kind'];

/** 箱の種類の名前 (箱の上に小さく出す。process・start・end と、文そのものが種類を表す try・catch・finally・return・throw は出さない) */
const KIND_LABELS: Partial<Record<Kind, string>> = {
    decision: '分岐',
    loop: '繰り返し',
    query: 'SOQL / SOSL',
    dml: 'DML',
    callout: '外部の呼び出し',
    event: 'イベント',
    call: 'Apex の呼び出し',
    navigate: '画面の遷移',
};

/** 箱の枠の色 */
const KIND_COLORS: Record<Kind, string> = {
    start: 'var(--foreground)',
    end: 'var(--foreground)',
    process: 'var(--ring)',
    decision: 'var(--flow-decision)',
    loop: 'var(--flow-loop)',
    query: 'var(--flow-query)',
    dml: 'var(--flow-dml)',
    callout: 'var(--flow-callout)',
    event: 'var(--flow-event)',
    call: 'var(--flow-query)',
    navigate: 'var(--flow-event)',
    try: 'var(--ring)',
    catch: 'var(--flow-exception)',
    finally: 'var(--ring)',
    return: 'var(--ring)',
    throw: 'var(--flow-exception)',
};

const EDGE_COLORS: Record<CodeFlowEdge['kind'], string> = {
    normal: 'var(--ring)',
    yes: 'var(--flow-loop)',
    no: 'var(--flow-decision)',
    case: 'var(--flow-decision)',
    loop: 'var(--flow-loop)',
    back: 'var(--flow-loop)',
    exception: 'var(--flow-exception)',
};

type ChartNode = Node<{ label: string; width: number; height: number }>;

const textOf = (node: CodeFlowNode) => {
    const lines = [
        ...(KIND_LABELS[node.kind] ? [`[${KIND_LABELS[node.kind]}]`] : []),
        node.label,
        ...(node.inLoop && (node.kind === 'query' || node.kind === 'dml') ? ['⚠ ループの中'] : []),
    ];
    return lines.join('\n');
};

const toElements = (flow: CodeFlow, selected: string | null) => {
    const nodes: ChartNode[] = flow.nodes.map((node) => {
        const label = textOf(node);
        const height = 20 + LINE_HEIGHT * wrappedLines(label);
        const color = KIND_COLORS[node.kind];
        const warning = node.inLoop && (node.kind === 'query' || node.kind === 'dml');
        return {
            id: node.id,
            position: { x: 0, y: 0 },
            data: { label, width: NODE_WIDTH, height },
            style: {
                width: NODE_WIDTH,
                height,
                whiteSpace: 'pre-line',
                fontSize: 12,
                lineHeight: `${LINE_HEIGHT}px`,
                padding: '8px 10px',
                textAlign: 'left',
                borderWidth: node.id === selected ? 3 : 2,
                borderStyle: warning ? 'dashed' : 'solid',
                borderColor: warning ? 'var(--flow-exception)' : color,
                borderRadius: node.kind === 'start' || node.kind === 'end' ? 999 : 8,
                background: 'var(--card)',
                color: 'var(--card-foreground)',
                cursor: node.detail ? 'pointer' : 'default',
            },
        };
    });
    const edges: Edge[] = flow.edges.map((edge, index) => {
        const stroke = EDGE_COLORS[edge.kind];
        return {
            id: `${edge.from}->${edge.to}:${index}`,
            source: edge.from,
            target: edge.to,
            ...(edge.label ? { label: edge.label } : {}),
            style: {
                stroke,
                strokeWidth: 1.5,
                ...(edge.kind === 'back' || edge.kind === 'exception'
                    ? { strokeDasharray: '5 4' }
                    : {}),
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
        };
    });
    return getLayoutedElements(nodes, edges, 'TB');
};

const OneChart = ({ flow, height }: { flow: CodeFlow; height: number | null }) => {
    const [selected, setSelected] = useState<string | null>(null);
    const { nodes, edges } = toElements(flow, selected);
    const bottom = Math.max(0, ...nodes.map((node) => node.position.y + node.data.height));
    const chartHeight = height ?? Math.min(720, Math.max(240, bottom + 48));
    const detail = flow.nodes.find((node) => node.id === selected);
    return (
        <div className="flex flex-col gap-2">
            <div className="bg-background w-full rounded-lg border" style={{ height: chartHeight }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    fitView
                    minZoom={0.2}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    onNodeClick={(_, node) => setSelected(node.id === selected ? null : node.id)}
                    proOptions={{ hideAttribution: true }}
                >
                    <Controls showInteractive={false} />
                    <Background gap={16} />
                </ReactFlow>
            </div>
            {detail?.detail && (
                <div className="flex flex-col gap-1">
                    <div className="text-muted-foreground text-xs">
                        {[
                            detail.line !== undefined ? `${detail.line} 行目` : null,
                            detail.count ? `${detail.count} 文` : null,
                        ]
                            .filter(Boolean)
                            .join('・')}
                    </div>
                    <pre className="bg-muted max-h-80 overflow-auto rounded-md p-2 font-mono text-xs leading-snug">
                        {detail.detail}
                    </pre>
                </div>
            )}
        </div>
    );
};

/** 名前 (owner.name か signature) で絞る */
const matches = (flow: CodeFlow, member: string) =>
    flow.member === member ||
    flow.signature === member ||
    `${flow.owner}.${flow.signature}` === member;

export const CodeFlowchartView = ({
    data,
    member,
    height,
}: {
    data: CodeFlow[] | undefined;
    member?: string | null | undefined;
    height?: number | null | undefined;
}) => {
    const flows = (data ?? []).filter((flow) => !member || matches(flow, member));
    const [index, setIndex] = useState(0);
    if (flows.length === 0) {
        return <p className="text-muted-foreground text-sm">図にする処理がありません</p>;
    }
    const flow = flows[Math.min(index, flows.length - 1)]!;
    return (
        <div className="flex flex-col gap-2">
            {flows.length > 1 ? (
                <select
                    className="bg-background w-fit max-w-full rounded-md border px-2 py-1 text-sm"
                    value={Math.min(index, flows.length - 1)}
                    onChange={(event) => setIndex(Number(event.target.value))}
                >
                    {flows.map((item, i) => (
                        <option key={`${item.member}:${item.signature}`} value={i}>
                            {`${item.owner}.${item.signature}`}
                        </option>
                    ))}
                </select>
            ) : null}
            <OneChart
                key={`${flow.member}:${flow.signature}`}
                flow={flow}
                height={height ?? null}
            />
        </div>
    );
};
