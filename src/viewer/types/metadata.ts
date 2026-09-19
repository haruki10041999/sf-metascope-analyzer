import { Edge } from 'reactflow';
import {
    MetadataObject,
    MetadataObjectDiff,
    MetadataField,
    MetadataFieldDiff,
    MetadataDependency,
    MetadataDependencyDiff,
} from '../../analyzer';

export type {
    MetadataObject,
    MetadataObjectDiff,
    MetadataField,
    MetadataFieldDiff,
    MetadataDependency,
    MetadataDependencyDiff,
} from '../../analyzer';

import { NodeSize } from './commons';

export type Field = (MetadataField | MetadataFieldDiff) & {
    id: string;
    height: number;
};

export const toField = (metadata: MetadataField | MetadataFieldDiff): Field => {
    return {
        ...metadata,
        id: crypto.randomUUID(),
        height: 24,
    };
};

export type ObjectNode = (Omit<MetadataObject, 'fields'> | Omit<MetadataObjectDiff, 'fields'>) &
    NodeSize & {
        id: string;
        fields: Field[];
        width: number;
        originalHeight: number;
        height: number;
        isExpanded: boolean;
        onToggleExpand: (id: string) => void;
    };

export const toObjectNode = (
    metadata: MetadataObject | MetadataObjectDiff,
    onToggleExpand: (id: string) => void,
): ObjectNode => {
    const fields: Field[] = metadata.fields.map((field) => toField(field));
    const objectNode: ObjectNode = {
        id: crypto.randomUUID(),
        apiName: metadata.apiName,
        dataType: metadata.dataType,
        fields,
        width: 280,
        originalHeight: 88,
        height: 88,
        isExpanded: false,
        onToggleExpand,
        status: 'status' in metadata ? metadata.status : undefined,
    };
    return objectNode;
};

export type DependencyEdge = (MetadataDependency | MetadataDependencyDiff) & {
    id: string;
    sourceId: string;
    targetId: string;
};

export const toDependencyEdge = (
    objectNodes: ObjectNode[],
    dependency: MetadataDependency | MetadataDependencyDiff,
): DependencyEdge | undefined => {
    const sourceObject = objectNodes.find(
        (objectNode) => objectNode.apiName === dependency.parentObjectApiName,
    );
    const targetObject = objectNodes.find(
        (objectNode) => objectNode.apiName === dependency.childObjectApiName,
    );

    if (sourceObject && targetObject) {
        return {
            ...dependency,
            id: crypto.randomUUID(),
            sourceId: sourceObject.id,
            targetId: targetObject.id,
        };
    }
};
