import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    NodeProps,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    MarkerType,
    Controls,
    Background,
    NodeTypes,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

import { MetadataObject, MetadataField, MetadataDependency } from '../../analyzer/types';

// --- 型定義 ---
export type Field = MetadataField & {
    id: string;
};

export type ObjectNode = Omit<MetadataObject, 'fields'> & {
    id: string;
    fields: Field[];
    isExpanded: boolean;
    onToggleExpand: (objectId: string) => void;
};

export type DependencyNode = MetadataDependency & {
    id: string;
};

// 1. オブジェクト用カスタムノード（大きな四角）
const ObjectNodeComponent: React.FC<NodeProps<ObjectNode>> = ({ id, data }) => {
    return (
        <div
            style={{
                background: '#ffffff',
                border: '2px solid #1e293b',
                borderRadius: '8px',
                width: '180px',
                padding: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                fontFamily: 'sans-serif',
            }}
        >
            <Handle type="target" position={Position.Left} id="left" />
            <Handle type="target" position={Position.Top} id="top" />

            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
                {data.apiName}
            </div>

            <button
                onClick={() => data.onToggleExpand(id)}
                style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                }}
            >
                {data.isExpanded ? '▲ 項目を隠す' : '▼ 項目を表示'}
            </button>

            <Handle type="source" position={Position.Right} id="right" />
            <Handle type="source" position={Position.Bottom} id="bottom" />
        </div>
    );
};

// 2. 項目用カスタムノード（小さな四角）
const DependencyNodeComponent: React.FC<NodeProps<DependencyNode>> = ({ id, data }) => {
    const isMaster = data.type === 'MasterDetail';
    const borderColor = isMaster ? '#dc2626' : '#2563eb';
    const bgColor = isMaster ? '#fef2f2' : '#eff6ff';

    return (
        <div
            style={{
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
                borderRadius: '6px',
                width: '140px',
                padding: '6px 10px',
                fontSize: '11px',
                fontFamily: 'sans-serif',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
        >
            <Handle type="target" position={Position.Left} />

            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{data.parentFieldApiName}</div>
            <div style={{ color: '#64748b', fontSize: '10px' }}>
                {data.type} ({isMaster ? '主従' : '参照'})
            </div>

            <Handle type="source" position={Position.Right} />
        </div>
    );
};

const nodeTypes: NodeTypes = {
    objectNode: ObjectNodeComponent,
    dependencyNode: DependencyNodeComponent,
};

// 3. Dagre によるレイアウト計算
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // 左から右（LR）へのフロー
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 });

    nodes.forEach((node) => {
        // ノードの種類に合わせてDagreに渡す幅・高さを変更
        const isObject = node.type === 'objectNode';
        const width = isObject ? 180 : 140;
        const height = isObject ? 80 : 45;

        dagreGraph.setNode(node.id, { width, height });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const isObject = node.type === 'objectNode';
        const width = isObject ? 180 : 140;
        const height = isObject ? 80 : 45;

        return {
            ...node,
            position: {
                x: nodeWithPosition.x - width / 2,
                y: nodeWithPosition.y - height / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

// --- 初期データマスタ ---
const OBJECT_MASTER = [
    {
        id: 'contact',
        label: '取引先責任者',
        fields: [
            {
                id: 'f-contact-account',
                name: 'AccountId',
                type: 'Lookup',
                relationType: 'lookup' as const,
                targetObjectId: 'account',
            },
        ],
    },
    {
        id: 'opportunity',
        label: '商談',
        fields: [
            {
                id: 'f-opp-account',
                name: 'AccountId',
                type: 'Master-Detail',
                relationType: 'masterDetail' as const,
                targetObjectId: 'account',
            },
        ],
    },
    {
        id: 'account',
        label: '取引先',
        fields: [],
    },
];

export default function App() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // トグル処理：ボタンを押したオブジェクトの「項目ノード」と「エッジ」を動的に生成/削除する
    const handleToggleExpand = useCallback(
        (objectId: string) => {
            setNodes((currentNodes) => {
                // 1. ボタンを押したオブジェクトの開閉フラグを反転
                const targetNode = currentNodes.find((n) => n.id === objectId);
                if (!targetNode) return currentNodes;

                const isExpanding = !targetNode.data.isExpanded;

                // 2. オブジェクトノードの更新
                const updatedObjectNodes = currentNodes.map((n) =>
                    n.id === objectId ? { ...n, data: { ...n.data, isExpanded: isExpanding } } : n,
                );

                // 3. 現在表示すべき全「項目ノード」と「エッジ」を再構築
                let newFieldNodes: Node[] = [];
                let newEdges: Edge[] = [];

                updatedObjectNodes.forEach((node) => {
                    if (node.type === 'objectNode' && node.data.isExpanded) {
                        const objMaster = OBJECT_MASTER.find((m) => m.id === node.id);

                        objMaster?.fields.forEach((field) => {
                            // A. 項目ノードの作成
                            newFieldNodes.push({
                                id: field.id,
                                type: 'fieldNode',
                                data: {
                                    name: field.name,
                                    type: field.type,
                                    relationType: field.relationType,
                                },
                                position: { x: 0, y: 0 },
                            });

                            // B. 所属エッジ（オブジェクト ──> 項目ノード）
                            newEdges.push({
                                id: `e-${node.id}-${field.id}`,
                                source: node.id,
                                target: field.id,
                                style: { stroke: '#94a3b8', strokeWidth: 1.5 },
                            });

                            // C. リレーションエッジ（項目ノード ──> 接続先オブジェクト）
                            if (field.targetObjectId) {
                                const isMaster = field.relationType === 'masterDetail';
                                newEdges.push({
                                    id: `e-${field.id}-${field.targetObjectId}`,
                                    source: field.id,
                                    target: field.targetObjectId,
                                    label: isMaster ? '主従' : '参照',
                                    animated: !isMaster, // 参照はアニメーション付き
                                    style: {
                                        stroke: isMaster ? '#dc2626' : '#2563eb',
                                        strokeWidth: isMaster ? 2.5 : 1.5,
                                        strokeDasharray: isMaster ? undefined : '4, 4',
                                    },
                                    markerEnd: {
                                        type: MarkerType.ArrowClosed,
                                        color: isMaster ? '#dc2626' : '#2563eb',
                                    },
                                });
                            }
                        });
                    }
                });

                // オブジェクトノード（項目以外）と新しく生成した項目ノードを統合
                const baseObjectNodes = updatedObjectNodes.filter((n) => n.type === 'objectNode');
                const allNodes = [...baseObjectNodes, ...newFieldNodes];

                // 4. Dagre で再計算して反映
                const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                    allNodes,
                    newEdges,
                );

                setEdges(layoutedEdges);
                return layoutedNodes;
            });
        },
        [setEdges, setNodes],
    );

    // 初期描画（全オブジェクトノードを生成）
    useEffect(() => {
        const initialObjectNodes: Node[] = OBJECT_MASTER.map((obj) => ({
            id: obj.id,
            type: 'objectNode',
            data: {
                label: obj.label,
                fields: obj.fields,
                isExpanded: false,
                onToggleExpand: handleToggleExpand,
            },
            position: { x: 0, y: 0 },
        }));

        const { nodes: layouted } = getLayoutedElements(initialObjectNodes, []);
        setNodes(layouted);
    }, [handleToggleExpand, setNodes]);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
            >
                <Controls />
                <Background color="#cbd5e1" gap={16} />
            </ReactFlow>
        </div>
    );
}
