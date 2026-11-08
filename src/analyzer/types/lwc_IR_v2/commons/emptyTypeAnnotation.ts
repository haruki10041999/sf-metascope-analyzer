import { isEmptyTypeAnnotation, type EmptyTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class EmptyTypeAnnotationTypeClass extends LwcCommonTypeClass<'emptyTypeAnnotation'> {
    private constructor() {
        super('emptyTypeAnnotation');
    }

    static create(
        _target: EmptyTypeAnnotation,
        _originalSource: string,
    ): EmptyTypeAnnotationTypeClass {
        return new EmptyTypeAnnotationTypeClass();
    }
}

export const emptyTypeAnnotationTypePair: EvaluatePair<
    EmptyTypeAnnotation,
    EmptyTypeAnnotationTypeClass
> = makeEvaluatePair(isEmptyTypeAnnotation, (target, originalSource) =>
    EmptyTypeAnnotationTypeClass.create(target, originalSource),
);

export const isEmptyTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is EmptyTypeAnnotationTypeClass => target instanceof EmptyTypeAnnotationTypeClass;
