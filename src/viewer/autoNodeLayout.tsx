import { Node, Edge } from 'reactflow';
import dagre from 'dagre';

export const getLayoutedElements = (
    nodes: Node[],
    edges: Edge[],
): {
    nodes: Node[];
    edges: Edge[];
} => {
    const dagreGraph = new dagre.graphlib.Graph();

    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        rankdir: 'LR',
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
