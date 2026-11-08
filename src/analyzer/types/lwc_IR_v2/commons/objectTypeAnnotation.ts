import { isObjectTypeAnnotation, type ObjectTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import {
    objectTypeCallPropertyTypePair,
    type ObjectTypeCallPropertyTypeClass,
} from './objectTypeCallProperty';
import { objectTypeIndexerTypePair, type ObjectTypeIndexerTypeClass } from './objectTypeIndexer';
import {
    objectTypeInternalSlotTypePair,
    type ObjectTypeInternalSlotTypeClass,
} from './objectTypeInternalSlot';
import { objectTypePropertyTypePair, type ObjectTypePropertyTypeClass } from './objectTypeProperty';
import {
    objectTypeSpreadPropertyTypePair,
    type ObjectTypeSpreadPropertyTypeClass,
} from './objectTypeSpreadProperty';

const objectTypeAnnotationPropertiesPairs = lazyPairs(
    () => [objectTypePropertyTypePair, objectTypeSpreadPropertyTypePair] as const,
);
const objectTypeAnnotationIndexersPairs = lazyPairs(() => [objectTypeIndexerTypePair] as const);
const objectTypeAnnotationCallPropertiesPairs = lazyPairs(
    () => [objectTypeCallPropertyTypePair] as const,
);
const objectTypeAnnotationInternalSlotsPairs = lazyPairs(
    () => [objectTypeInternalSlotTypePair] as const,
);

export type ObjectTypeAnnotationFields = {
    properties: (
        ObjectTypePropertyTypeClass | ObjectTypeSpreadPropertyTypeClass | LwcErrorTypeClass
    )[];
    indexers: (ObjectTypeIndexerTypeClass | LwcErrorTypeClass)[];
    callProperties: (ObjectTypeCallPropertyTypeClass | LwcErrorTypeClass)[];
    internalSlots: (ObjectTypeInternalSlotTypeClass | LwcErrorTypeClass)[];
    exact: ObjectTypeAnnotation['exact'];
    inexact: NonNullable<ObjectTypeAnnotation['inexact']> | null;
};

export class ObjectTypeAnnotationTypeClass extends LwcCommonTypeClass<'objectTypeAnnotation'> {
    private readonly value: ObjectTypeAnnotationFields;

    private constructor(value: ObjectTypeAnnotationFields) {
        super('objectTypeAnnotation');
        this.value = value;
    }

    static create(
        target: ObjectTypeAnnotation,
        originalSource: string,
    ): ObjectTypeAnnotationTypeClass {
        return new ObjectTypeAnnotationTypeClass({
            properties: visitNodeList(
                target.properties,
                originalSource,
                objectTypeAnnotationPropertiesPairs(),
                'ObjectTypeAnnotation.properties',
            ),
            indexers: visitNodeList(
                target.indexers,
                originalSource,
                objectTypeAnnotationIndexersPairs(),
                'ObjectTypeAnnotation.indexers',
            ),
            callProperties: visitNodeList(
                target.callProperties,
                originalSource,
                objectTypeAnnotationCallPropertiesPairs(),
                'ObjectTypeAnnotation.callProperties',
            ),
            internalSlots: visitNodeList(
                target.internalSlots,
                originalSource,
                objectTypeAnnotationInternalSlotsPairs(),
                'ObjectTypeAnnotation.internalSlots',
            ),
            exact: target.exact,
            inexact: target.inexact ?? null,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ObjectTypeAnnotationFields {
        return this.value;
    }

    getProperties(): ObjectTypeAnnotationFields['properties'] {
        return this.value.properties;
    }

    getIndexers(): ObjectTypeAnnotationFields['indexers'] {
        return this.value.indexers;
    }

    getCallProperties(): ObjectTypeAnnotationFields['callProperties'] {
        return this.value.callProperties;
    }

    getInternalSlots(): ObjectTypeAnnotationFields['internalSlots'] {
        return this.value.internalSlots;
    }

    getExact(): ObjectTypeAnnotationFields['exact'] {
        return this.value.exact;
    }

    getInexact(): ObjectTypeAnnotationFields['inexact'] {
        return this.value.inexact;
    }
}

export const objectTypeAnnotationTypePair: EvaluatePair<
    ObjectTypeAnnotation,
    ObjectTypeAnnotationTypeClass
> = makeEvaluatePair(isObjectTypeAnnotation, (target, originalSource) =>
    ObjectTypeAnnotationTypeClass.create(target, originalSource),
);

export const isObjectTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectTypeAnnotationTypeClass => target instanceof ObjectTypeAnnotationTypeClass;
