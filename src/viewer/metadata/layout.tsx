import { useCallback, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    useNodesState,
    useEdgesState,
    MarkerType,
    Controls,
    Background,
    NodeTypes,
    EdgeTypes,
} from 'reactflow';

import type { MetadataProp, ObjectNode } from '../types';
import { toObjectNode, toDependencyEdge } from '../types';
import { ObjectNodeComponent, DependencyEdgeComponent } from './node';
import { getLayoutedElements } from '../autoNodeLayout';

const nodeTypes: NodeTypes = {
    objectNode: ObjectNodeComponent,
};
const edgeTypes: EdgeTypes = {
    dependencyEdge: DependencyEdgeComponent,
};

export function layout(metadataProp: MetadataProp) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const handleToggleExpand = useCallback(
        (id: string) => {
            setNodes((currentNodes: Node<ObjectNode>[]) => {
                const targetNode = currentNodes.find((node) => node.id === id)!;
                const isExpanding = !targetNode.data.isExpanded;

                const updatedObjectNodes = currentNodes.map((n) =>
                    n.id === id
                        ? {
                              ...n,
                              data: {
                                  ...n.data,
                                  isExpanded: isExpanding,
                                  height: isExpanding
                                      ? n.data.originalHeight +
                                        n.data.fields.reduce(
                                            (acc, current) => acc + current.height,
                                            0,
                                        )
                                      : n.data.originalHeight,
                              },
                          }
                        : n,
                );

                // 4. Dagre で再計算して反映
                const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                    updatedObjectNodes,
                    edges,
                );

                setEdges(layoutedEdges);
                return layoutedNodes;
            });
        },
        [setEdges, setNodes],
    );

    useEffect(() => {
        const initialObjectNodes: Node[] = metadataProp.metadata.map((metadata) => {
            const objNode = toObjectNode(metadata, handleToggleExpand);
            return {
                id: objNode.id,
                type: 'objectNode',
                data: objNode,
                position: { x: 0, y: 0 },
            };
        });

        const initialDependencyEdge: Edge[] = [];
        metadataProp.dependency.forEach((metadata) => {
            const depEdge = toDependencyEdge(
                initialObjectNodes.map((initialObjectNode) => initialObjectNode.data as ObjectNode),
                metadata,
            );
            if (depEdge) {
                initialDependencyEdge.push({
                    id: depEdge.id,
                    source: depEdge.sourceId,
                    target: depEdge.targetId,
                    type: 'dependencyEdge',
                    data: depEdge,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                    },
                });
            }
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialObjectNodes,
            initialDependencyEdge,
        );
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, [handleToggleExpand, setNodes, setEdges]);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
            >
                <Controls />
                <Background color="#cbd5e1" gap={16} />
            </ReactFlow>
        </div>
    );
}
