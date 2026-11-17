import { Background, Controls, type Edge, MarkerType, type Node, ReactFlow } from '@xyflow/react';

import type { FlowDiagram } from '../../../analyzer/report/types';
import { getLayoutedElements } from '../../autoNodeLayout';

import { STATUS_LABELS, STATUS_STROKES, statusOf } from './status';

// Flow の要素と接続の図 (flow.diagram)。自動配置は dagre (autoNodeLayout.tsx)、色は status

const NODE_WIDTH = 200;
const NODE_HEIGHT = 56;

type FlowNode = Node<{ label: string; width: number; height: number }>;

const toElements = (diagram: FlowDiagram) => {
    const nodes: FlowNode[] = diagram.nodes.map((node) => {
        const status = statusOf(node);
        return {
            id: node.id,
            position: { x: 0, y: 0 },
            data: {
                label: `${node.label ?? node.id}\n(${node.kind}${status !== 'unchanged' ? `・${STATUS_LABELS[status]}` : ''})`,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
            },
            style: {
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                whiteSpace: 'pre-line',
                fontSize: 12,
                borderWidth: 2,
                borderColor: STATUS_STROKES[status],
                background: 'var(--card)',
                color: 'var(--card-foreground)',
            },
        };
    });
    const edges: Edge[] = diagram.edges.map((edge, index) => {
        const stroke = STATUS_STROKES[statusOf(edge)];
        return {
            id: `${edge.from}->${edge.to}:${index}`,
            source: edge.from,
            target: edge.to,
            ...(edge.edgeType !== 'connector' ? { label: edge.edgeType } : {}),
            style: { stroke, strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
        };
    });
    return getLayoutedElements(nodes, edges);
};

const OneFlow = ({ diagram }: { diagram: FlowDiagram }) => {
    const { nodes, edges } = toElements(diagram);
    return (
        <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">{diagram.flow}</div>
            <div className="bg-background h-[480px] w-full rounded-lg border">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    fitView
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

export const FlowDiagramView = ({
    data,
    flow,
}: {
    data: FlowDiagram[] | undefined;
    flow?: string | null | undefined;
}) => {
    const diagrams = (data ?? []).filter((diagram) => !flow || diagram.flow === flow);
    if (diagrams.length === 0) {
        return <p className="text-muted-foreground text-sm">図にする Flow がありません</p>;
    }
    return (
        <div className="flex flex-col gap-6">
            {diagrams.map((diagram) => (
                <OneFlow key={diagram.flow} diagram={diagram} />
            ))}
        </div>
    );
};
