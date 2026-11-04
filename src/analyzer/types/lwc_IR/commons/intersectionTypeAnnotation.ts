import { isIntersectionTypeAnnotation, type IntersectionTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class IntersectionTypeAnnotationTypeClass extends LwcCommonTypeClass<'intersectionTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('intersectionTypeAnnotation', originalSource);
    }

    static create(
        target: IntersectionTypeAnnotation,
        originalSource: string,
    ): IntersectionTypeAnnotationTypeClass {
        throw new Error(
            'IntersectionTypeAnnotationTypeClass.create is not implemented: ' + target.type,
        );
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
