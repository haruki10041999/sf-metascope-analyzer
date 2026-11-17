import { useState } from 'react';
import {
    Background,
    Controls,
    type Edge,
    Handle,
    MarkerType,
    type Node,
    type NodeProps,
    Position,
    ReactFlow,
} from '@xyflow/react';

import type { ObjectDiagram } from '../../../analyzer/report/types';
import { getLayoutedElements } from '../../autoNodeLayout';

import { STATUS_BOX_CLASSES, STATUS_LABELS, STATUS_STROKES, statusOf } from './status';

// オブジェクトの ER 図 (object.diagram)。箱はオブジェクト、線は参照・主従関係 (主従は太線)。
// 自動配置は dagre (autoNodeLayout.tsx)、色は status。既定では参照の項目だけを箱に並べ、showAllFields ですべての項目

const NODE_WIDTH = 240;
const HEADER_HEIGHT = 44;
const FIELD_HEIGHT = 20;

type DiagramObject = ObjectDiagram['objects'][number];
type ObjectNodeData = {
    object: DiagramObject;
    fields: DiagramObject['fields'];
    width: number;
    height: number;
};
type ObjectFlowNode = Node<ObjectNodeData, 'object'>;

const ObjectBox = ({ data }: NodeProps<ObjectFlowNode>) => {
    const { object, fields } = data;
    const status = statusOf(object);
    return (
        <div
            className={`rounded-md border-2 text-xs shadow-sm ${STATUS_BOX_CLASSES[status]} ${object.external ? 'border-dashed opacity-70' : ''}`}
            style={{ width: NODE_WIDTH }}
        >
            <Handle type="target" position={Position.Left} />
            <div className="border-b px-2 py-1">
                <div className="font-semibold">{object.label ?? object.name}</div>
                <div className="text-muted-foreground">
                    {object.name}
                    {status !== 'unchanged' ? `・${STATUS_LABELS[status]}` : ''}
                    {object.external ? '・リポジトリにない' : ''}
                </div>
            </div>
            {fields.length > 0 && (
                <ul className="px-2 py-1">
                    {fields.map((field) => {
                        const fieldStatus = statusOf(field);
                        return (
                            <li
                                key={field.name}
                                className="flex justify-between gap-2 truncate"
                                style={{ height: FIELD_HEIGHT }}
                                title={field.label ?? field.name}
                            >
                                <span
                                    className="truncate"
                                    style={
                                        fieldStatus !== 'unchanged'
                                            ? { color: STATUS_STROKES[fieldStatus] }
                                            : undefined
                                    }
                                >
                                    {field.name}
                                </span>
                                <span className="text-muted-foreground shrink-0">
                                    {field.referenceTo ? `→ ${field.referenceTo}` : field.type}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
            <Handle type="source" position={Position.Right} />
        </div>
    );
};

const nodeTypes = { object: ObjectBox };

const toElements = (diagram: ObjectDiagram, showAllFields: boolean) => {
    const nodes: ObjectFlowNode[] = diagram.objects.map((object) => {
        const fields = showAllFields ? object.fields : object.fields.filter((f) => f.referenceTo);
        return {
            id: object.name,
            type: 'object',
            position: { x: 0, y: 0 },
            data: {
                object,
                fields,
                width: NODE_WIDTH,
                height: HEADER_HEIGHT + fields.length * FIELD_HEIGHT + (fields.length ? 8 : 0),
            },
        };
    });
    const edges: Edge[] = diagram.relations.map((relation) => {
        const stroke = STATUS_STROKES[statusOf(relation)];
        const masterDetail = relation.type === 'MasterDetail';
        return {
            id: `${relation.from}.${relation.field}->${relation.to}`,
            source: relation.from,
            target: relation.to,
            label: `${relation.field}${masterDetail ? '（主従）' : ''}`,
            style: { stroke, strokeWidth: masterDetail ? 2.5 : 1.25 },
            markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
        };
    });
    return getLayoutedElements(nodes, edges);
};

export const ObjectDiagramView = ({
    data,
    showAllFields,
}: {
    data: ObjectDiagram | undefined;
    showAllFields?: boolean | null | undefined;
}) => {
    const [all, setAll] = useState(showAllFields ?? false);
    if (!data) return null;
    if (data.objects.length === 0) {
        return <div className="text-muted-foreground text-sm">オブジェクトがありません</div>;
    }
    const { nodes, edges } = toElements(data, all);
    return (
        <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
                すべての項目を表示する
            </label>
            <div className="bg-background h-[560px] w-full rounded-lg border">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    nodesDraggable
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
