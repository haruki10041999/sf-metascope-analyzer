import type { DependencyView, FieldView, ObjectView } from '../../analyzer';

export type { DependencyView, FieldView, ObjectView, ViewStatus } from '../../analyzer';

import { NodeSize } from './commons';

export type Field = FieldView & {
    id: string;
    height: number;
};

export const toField = (field: FieldView): Field => {
    return {
        ...field,
        id: crypto.randomUUID(),
        height: 24,
    };
};

export type ObjectNode = Omit<ObjectView, 'fields'> &
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
    metadata: ObjectView,
    onToggleExpand: (id: string) => void,
): ObjectNode => {
    const { fields, ...object } = metadata;
    return {
        ...object,
        id: crypto.randomUUID(),
        fields: fields.map((field) => toField(field)),
        width: 280,
        originalHeight: 88,
        height: 88,
        isExpanded: false,
        onToggleExpand,
    };
};

export type DependencyEdge = DependencyView & {
    id: string;
    sourceId: string;
    targetId: string;
};

export const toDependencyEdge = (
    objectNodes: ObjectNode[],
    dependency: DependencyView,
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
