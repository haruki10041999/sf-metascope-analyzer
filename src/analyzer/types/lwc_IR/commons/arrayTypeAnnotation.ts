import { isArrayTypeAnnotation, type ArrayTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ArrayTypeAnnotationTypeClass extends LwcCommonTypeClass<'arrayTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('arrayTypeAnnotation', originalSource);
    }

    static create(
        target: ArrayTypeAnnotation,
        originalSource: string,
    ): ArrayTypeAnnotationTypeClass {
        throw new Error('ArrayTypeAnnotationTypeClass.create is not implemented: ' + target.type);
    }
}

export const arrayTypeAnnotationTypePair: EvaluatePair<
    ArrayTypeAnnotation,
    ArrayTypeAnnotationTypeClass
> = makeEvaluatePair(isArrayTypeAnnotation, (target, originalSource) =>
    ArrayTypeAnnotationTypeClass.create(target, originalSource),
);

export const isArrayTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is ArrayTypeAnnotationTypeClass => target instanceof ArrayTypeAnnotationTypeClass;
