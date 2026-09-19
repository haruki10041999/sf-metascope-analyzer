import React from 'react';
import {
    NodeProps,
    Handle,
    Position,
    BaseEdge,
    EdgeLabelRenderer,
    EdgeProps,
    getBezierPath,
} from 'reactflow';

import { ObjectNode, DependencyEdge } from '../types';

export const ObjectNodeComponent: React.FC<NodeProps<ObjectNode>> = ({ data }) => {
    return (
        <div className="object_node">
            <Handle type="target" position={Position.Left} id="left" />
            <Handle type="target" position={Position.Top} id="top" />
            <div className="object_node_name">
                {data.apiName}
                {'status' in data && (
                    <span className={`status_badge status_badge_${data.status.toLowerCase()}`}>
                        {data.status}
                    </span>
                )}
            </div>
            {data.isExpanded && (
                <div className="object_node_fields">
                    {data.fields.map((field) => (
                        <div key={field.id} className="object_node_field">
                            {'status' in field && (
                                <span
                                    className={`status_badge status_badge_${field.status.toLowerCase()}`}
                                >
                                    {field.status}
                                </span>
                            )}
                            <span className="object_node_field_name">{field.apiName}</span>

                            <span className="object_node_field_type">
                                {field.type === 'Lookup' || field.type === 'MasterDetail'
                                    ? field.referenceObjectApiName
                                    : field.type}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            <button onClick={() => data.onToggleExpand(data.id)} className="object_node_button">
                {data.isExpanded ? '▲ 項目を隠す' : '▼ 項目を表示'}
            </button>
            <Handle type="source" position={Position.Right} id="right" />
            <Handle type="source" position={Position.Bottom} id="bottom" />
        </div>
    );
};

export const DependencyEdgeComponent: React.FC<EdgeProps<DependencyEdge>> = ({
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    data,
}) => {
    if (!data) return;

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const relationClass =
        data.type === 'MasterDetail' ? 'dependency-edge-master-detail' : 'dependency-edge-lookup';

    return (
        <>
            <BaseEdge id={id} path={edgePath} />
            <EdgeLabelRenderer>
                <div
                    className={`dependency-edge-label ${relationClass}`}
                    style={{
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                    }}
                >
                    <span className="dependency-edge-field">{data.parentFieldApiName}</span>
                    {'status' in data && (
                        <span className={`status_badge status_badge_${data.status.toLowerCase()}`}>
                            {data.status}
                        </span>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
};
