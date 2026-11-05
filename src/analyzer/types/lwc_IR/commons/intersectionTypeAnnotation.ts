import { isIntersectionTypeAnnotation, type IntersectionTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type IntersectionTypeAnnotationFields = {
    types: (FlowTypeTypeClass | LwcErrorTypeClass)[];
};

export class IntersectionTypeAnnotationTypeClass extends LwcCommonTypeClass<'intersectionTypeAnnotation'> {
    private readonly value: IntersectionTypeAnnotationFields;

    private constructor(value: IntersectionTypeAnnotationFields) {
        super('intersectionTypeAnnotation');
        this.value = value;
    }

    static create(
        target: IntersectionTypeAnnotation,
        originalSource: string,
    ): IntersectionTypeAnnotationTypeClass {
        return new IntersectionTypeAnnotationTypeClass({
            types: visitNodeList(
                target.types,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): IntersectionTypeAnnotationFields {
        return this.value;
    }

    getTypes(): IntersectionTypeAnnotationFields['types'] {
        return this.value.types;
    }
}

export const intersectionTypeAnnotationTypePair: EvaluatePair<
    IntersectionTypeAnnotation,
    IntersectionTypeAnnotationTypeClass
> = makeEvaluatePair(isIntersectionTypeAnnotation, (target, originalSource) =>
    IntersectionTypeAnnotationTypeClass.create(target, originalSource),
);

export const isIntersectionTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is IntersectionTypeAnnotationTypeClass =>
    target instanceof IntersectionTypeAnnotationTypeClass;
