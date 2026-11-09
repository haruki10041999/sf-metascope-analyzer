import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isObjectTypeAnnotation, type ObjectTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { ObjectTypeCallPropertyTypeClass } from './objectTypeCallProperty';
import { ObjectTypeIndexerTypeClass } from './objectTypeIndexer';
import { ObjectTypeInternalSlotTypeClass } from './objectTypeInternalSlot';
import { objectTypePropertyTypePair, type ObjectTypePropertyTypeClass } from './objectTypeProperty';
import {
    objectTypeSpreadPropertyTypePair,
    type ObjectTypeSpreadPropertyTypeClass,
} from './objectTypeSpreadProperty';

const objectTypeAnnotationPropertiesPairs = lazyPairs(
    () => [objectTypePropertyTypePair, objectTypeSpreadPropertyTypePair] as const,
);

export type ObjectTypeAnnotationFields = TypeField<'objectTypeAnnotation'> & {
    properties: (ObjectTypePropertyTypeClass | ObjectTypeSpreadPropertyTypeClass)[];
    indexers: ObjectTypeIndexerTypeClass[];
    callProperties: ObjectTypeCallPropertyTypeClass[];
    internalSlots: ObjectTypeInternalSlotTypeClass[];
    /** `{| |}` は exact、`{ ... }` は inexact、どちらでもないものは default */
    exactness: 'exact' | 'inexact' | 'default';
};

export class ObjectTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'objectTypeAnnotation',
    ObjectTypeAnnotationFields
> {
    private constructor(value: FieldsOf<ObjectTypeAnnotationFields>, sourceSpan: SourceSpan) {
        super('objectTypeAnnotation', value, sourceSpan);
    }

    static create(
        target: ObjectTypeAnnotation,
        originalSource: string,
    ): ObjectTypeAnnotationTypeClass {
        return new ObjectTypeAnnotationTypeClass(
            {
                properties: visitNodeList(
                    target.properties,
                    originalSource,
                    objectTypeAnnotationPropertiesPairs(),
                    'ObjectTypeAnnotation.properties',
                ),
                indexers: target.indexers.map((child) =>
                    ObjectTypeIndexerTypeClass.create(child, originalSource),
                ),
                callProperties: target.callProperties.map((child) =>
                    ObjectTypeCallPropertyTypeClass.create(child, originalSource),
                ),
                internalSlots: target.internalSlots.map((child) =>
                    ObjectTypeInternalSlotTypeClass.create(child, originalSource),
                ),
                exactness: target.exact ? 'exact' : target.inexact ? 'inexact' : 'default',
            },
            getSourceSpan(target, originalSource),
        );
    }

    getProperties(): ObjectTypeAnnotationFields['properties'] {
        return this.getFields().properties;
    }

    getIndexers(): ObjectTypeAnnotationFields['indexers'] {
        return this.getFields().indexers;
    }

    getCallProperties(): ObjectTypeAnnotationFields['callProperties'] {
        return this.getFields().callProperties;
    }

    getInternalSlots(): ObjectTypeAnnotationFields['internalSlots'] {
        return this.getFields().internalSlots;
    }

    getExactness(): ObjectTypeAnnotationFields['exactness'] {
        return this.getFields().exactness;
    }
}

export const objectTypeAnnotationTypePair: EvaluatePair<
    ObjectTypeAnnotation,
    ObjectTypeAnnotationTypeClass
> = makeEvaluatePair(isObjectTypeAnnotation, (target, originalSource) =>
    ObjectTypeAnnotationTypeClass.create(target, originalSource),
);

export const isObjectTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ObjectTypeAnnotationTypeClass => target instanceof ObjectTypeAnnotationTypeClass;
