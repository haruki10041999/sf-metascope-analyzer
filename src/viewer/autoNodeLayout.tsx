import type { Edge, Node } from '@xyflow/react';
import dagre from '@dagrejs/dagre';

/** 大きさ (width・height) を data に持つノード */
type SizedNode = Node<{ width: number; height: number }>;

export const getLayoutedElements = <N extends SizedNode, E extends Edge>(
    nodes: N[],
    edges: E[],
    /** 並べる向き (LR: 左から右 (既定) / TB: 上から下) */
    rankdir: 'LR' | 'TB' = 'LR',
): {
    nodes: N[];
    edges: E[];
} => {
    const dagreGraph = new dagre.graphlib.Graph();

    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        rankdir,
        nodesep: 40,
        ranksep: 80,
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
            width: node.data.width,
            height: node.data.height,
        });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - node.data.width / 2,
                y: nodeWithPosition.y - node.data.height / 2,
            },
        };
    });

    return {
        nodes: layoutedNodes,
        edges,
    };
};
