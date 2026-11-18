import {
    Background,
    Controls,
    type Edge,
    MarkerType,
    type Node,
    Position,
    ReactFlow,
} from '@xyflow/react';

import type { EventFlow, EventFlowEdge, EventFlowNode } from '../../../analyzer/report/types';
import { getLayoutedElements } from '../../autoNodeLayout';

// LWC の、利用者の操作から処理までの流れ (lwc.eventFlow)。左から右に並べ (dagre)、箱の種類で色を変える (styles.css の --flow-*)

const NODE_WIDTH = 220;
const LINE_HEIGHT = 16;

type Kind = EventFlowNode['kind'];

/** 箱の種類の名前 (箱の上に小さく出す) */
const KIND_LABELS: Record<Kind, string> = {
    action: '操作',
    lifecycle: '表示',
    wire: '@wire',
    handler: 'ハンドラー',
    apex: 'Apex',
    refresh: '再取得',
    event: 'イベント',
    toast: 'トースト',
    navigate: '画面の遷移',
    message: 'メッセージ',
};

const KIND_COLORS: Record<Kind, string> = {
    action: 'var(--foreground)',
    lifecycle: 'var(--foreground)',
    wire: 'var(--flow-query)',
    handler: 'var(--ring)',
    apex: 'var(--flow-query)',
    refresh: 'var(--flow-query)',
    event: 'var(--flow-event)',
    toast: 'var(--flow-event)',
    navigate: 'var(--flow-callout)',
    message: 'var(--flow-event)',
};

const EDGE_COLORS: Record<EventFlowEdge['kind'], string> = {
    flow: 'var(--ring)',
    data: 'var(--flow-query)',
    event: 'var(--flow-event)',
};

type ChartNode = Node<{ label: string; width: number; height: number }>;

const toElements = (flow: EventFlow) => {
    const nodes: ChartNode[] = flow.nodes.map((node) => {
        const label = [
            `[${KIND_LABELS[node.kind]}${node.component ? `・${node.component}` : ''}]`,
            node.label,
        ].join('\n');
        const height = 20 + LINE_HEIGHT * 2 + (node.label.length > 28 ? LINE_HEIGHT : 0);
        return {
            id: node.id,
            position: { x: 0, y: 0 },
            // 左から右に並べるので、線は箱の右から出て左に入る
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            data: { label, width: NODE_WIDTH, height },
            style: {
                width: NODE_WIDTH,
                height,
                whiteSpace: 'pre-line',
                fontSize: 12,
                lineHeight: `${LINE_HEIGHT}px`,
                padding: '8px 10px',
                textAlign: 'left',
                borderWidth: 2,
                borderColor: KIND_COLORS[node.kind],
                borderRadius: node.kind === 'action' || node.kind === 'lifecycle' ? 999 : 8,
                background: 'var(--card)',
                color: 'var(--card-foreground)',
                overflow: 'hidden',
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
                ...(edge.kind === 'event' ? { strokeDasharray: '5 4' } : {}),
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
        };
    });
    return getLayoutedElements(nodes, edges, 'LR');
};

export const EventFlowView = ({
    data,
    height,
}: {
    data: EventFlow | undefined;
    height?: number | null | undefined;
}) => {
    if (!data || data.nodes.length === 0) {
        return <p className="text-muted-foreground text-sm">流れにするイベントがありません</p>;
    }
    const { nodes, edges } = toElements(data);
    const bottom = Math.max(0, ...nodes.map((node) => node.position.y + node.data.height));
    const chartHeight = height ?? Math.min(720, Math.max(240, bottom + 48));
    return (
        <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-xs">
                コンポーネント: {data.components.join('・')}
            </div>
            <div className="bg-background w-full rounded-lg border" style={{ height: chartHeight }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    fitView
                    minZoom={0.2}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    proOptions={{ hideAttribution: true }}
                >
                    <Controls showInteractive={false} />
                    <Background gap={16} />
                </ReactFlow>
            </div>
        </div>
    );
};
