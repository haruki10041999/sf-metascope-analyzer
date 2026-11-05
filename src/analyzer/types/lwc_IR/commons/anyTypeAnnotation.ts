import { isAnyTypeAnnotation, type AnyTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class AnyTypeAnnotationTypeClass extends LwcCommonTypeClass<'anyTypeAnnotation'> {
    private constructor() {
        super('anyTypeAnnotation');
    }

    static create(_target: AnyTypeAnnotation, _originalSource: string): AnyTypeAnnotationTypeClass {
        return new AnyTypeAnnotationTypeClass();
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
