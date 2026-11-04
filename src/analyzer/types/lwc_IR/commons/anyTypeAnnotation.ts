import { isAnyTypeAnnotation, type AnyTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class AnyTypeAnnotationTypeClass extends LwcCommonTypeClass<'anyTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('anyTypeAnnotation', originalSource);
    }

    static create(target: AnyTypeAnnotation, originalSource: string): AnyTypeAnnotationTypeClass {
        return new AnyTypeAnnotationTypeClass(originalSource);
    }
}

export const anyTypeAnnotationTypePair: EvaluatePair<
    AnyTypeAnnotation,
    AnyTypeAnnotationTypeClass
> = makeEvaluatePair(isAnyTypeAnnotation, (target, originalSource) =>
    AnyTypeAnnotationTypeClass.create(target, originalSource),
);

export const isAnyTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is AnyTypeAnnotationTypeClass => target instanceof AnyTypeAnnotationTypeClass;
